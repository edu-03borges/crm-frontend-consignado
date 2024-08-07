/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import { Box, Button, Chip, Container, FormControl, Menu, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { heightButton } from 'store/constant';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MainCard from 'ui-component/cards/MainCard';
import GeneralSkeleton from 'ui-component/cards/Skeleton/GeneralSkeleton';
import Loader from 'ui-component/Loader';

import CheckIcon from '@mui/icons-material/Check';

import UploadFileIcon from '@mui/icons-material/UploadFile';
import HelpIcon from '@mui/icons-material/Help';

import api, { customApi } from 'utils/api';
import notify from 'utils/notify';

const CriarCampanhas = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const { userInfo } = useSelector(({ auth }) => auth);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [loadingType, setLoadingType] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataXlsx, setDataXlsx] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    setLoading(false);

    showDataInstances();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    data.records = dataXlsx.length;
    data.file_data = JSON.stringify(dataXlsx);
    data.instances = selectedInstances;
    data.continue = false;
    data.idUser = userInfo.id;
    
    if (!data.instances.length) {
      notify.error('Erro. Necessário ao menos uma instância');
      return;
    }

    if (!data.name) {
      notify.error('Erro. Preencher o nome da campanha');
      return;
    }

    if (!data.company) {
      notify.error('Erro. Preencher o nome da empresa');
      return;
    }

    if (!data.records) {
      notify.error('Erro. Subir um arquivo com dados');
      return;
    }

    try {
      setLoading(true);
      setLoadingType(2);

      // const publicUrl = await getPublicUrl();

      const response = await customApi.post(`http://localhost:5000/start`, data);

      if (response.status == 200) {
        navigate('/tools/fgts-simulation-automation/campaigns-list');

        setLoading(false);

        notify.success('Aguarde. Iniciando campanha...');
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data && error.response.data.message)
        notify.error(`Erro. ${error.response.data.message}`);
      else
        notify.error(`Erro. Não foi possível criar a campanha!`);
    }
  };

  async function getPublicUrl() {
    try {
      const response = await api.get(`/utils/get_public_url`);

      if (response && response.status === 200 && response.data) {
        return response.data;
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message)
        notify.error(`Erro. ${error.response.data.message}`);
      else
        notify.error(`Erro. Não foi possível pegar a url pública!`);
    }
  }

  function downloadExcelFileModel() {
    const worksheet = XLSX.utils.aoa_to_sheet([['CPFS']]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, "IMPORTAÇÃO_MODELO" + '.xlsx');
  }

  async function handleFileUpload(ev) {
    ev.preventDefault();
    const reader = new FileReader();

    const columnHeaders = [];

    // setLoading(true);
    reader.onload = async () => {
      const fileData = reader.result;
      const wb = XLSX.read(fileData, { type: 'binary' });

      const sheet_name_list = wb.SheetNames;
      for (let sheetIndex = 0; sheetIndex < sheet_name_list.length; sheetIndex++) {
        const worksheet = wb.Sheets[sheet_name_list[sheetIndex]];

        let col = 0;
        for (const key in worksheet) {
          {
            if (col <= 78) {
              const key2 = key.substr(key.length - 1, 1);
              if (key2 == '1') columnHeaders.push(worksheet[key].v);
            }
          }
          col++;
        }
      }

      const first_worksheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(first_worksheet, { header: 0 });

      processExcel({ columnHeaders, data });
    };

    if (ev.target.files[0]) {
      reader.readAsBinaryString(ev.target.files[0]);
      setSelectedFile(ev.target.files[0]);
    } else {
      setLoading(false);
    }
  }

  async function processExcel({ data, columnHeaders }) {
    const columnNames = [];

    for (const info of data) {
      const obj = {};

      const header_cpf = columnHeaders[0];
     
      obj.cpf = String( 
        formatCPF(info[header_cpf])
        .trim()
        .replace(/^[\r\n]+|[\r\n]+$/g, '')
      );

      columnNames.push(obj);
    }
    
    const uniqueList = removeDuplicateCpfs(columnNames)

    setDataXlsx(uniqueList);
  }

  function removeDuplicateCpfs(list) {
    const seenCpfs = new Set();
    const uniqueList = [];

    for (const item of list) {
        const cpf = item.cpf;
        if (!seenCpfs.has(cpf)) {
            uniqueList.push(item);
            seenCpfs.add(cpf);
        }
    }

    return uniqueList;
  }

  const formatCPF = (cpf) => {
    let cpfString = cpf.toString();
    while (cpfString.length < 11) {
        cpfString = '0' + cpfString;
    }
    return cpfString;
  }

  const showDataInstances = async () => {
    try {
      setLoading(true);
      setLoadingType(1);

      const response = await api.get('/tools/fgts_simulation_automation/show_status_instances');

      if (response && response.status === 200 && response.data) {
        setInstances(response.data);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.data && error.response.data.message)
        notify.error(`Erro. ${error.response.data.message}`);
      else
        notify.error(`Erro. Não foi possível listas as instâncias!`);
    }
  }

  return (
    <>
      {isLoading ? loadingType == 1 ? (
        <GeneralSkeleton />
      ) : (
        <Loader />
      ) : (
        <>
          <Container maxWidth="xxl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '-10px', marginBottom: '10px' }}>
            <Typography variant="h2" color="secondary">
              Criar Campanha
            </Typography>

          <div>
            <IconButton aria-label="menu de opções" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={downloadExcelFileModel}>
                <HelpIcon sx={{ marginRight: '5px' }} />
                  Download do Modelo
                </MenuItem>
            </Menu>
          </div>

          </Container>
          <MainCard>
            <Grid container>
              <Grid container item spacing={2}>
                <Grid item xs={12}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid container item spacing={2}>
                        <Grid item xs={isMobile ? 12 : 0} md={isMobile ? 12 : 4}>
                          <Typography variant="subtitle1" color="secondary" sx={{ mb: 1 }}>
                            INSTÂNCIAS
                          </Typography>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel 
                              id="instances-label" 
                              shrink={false} 
                              style={{
                                display: selectedInstances.length ? 'none' : 'block'
                              }}
                            >Instâncias</InputLabel>
                            <Select
                              labelId="instances-label"
                              id="instances"
                              multiple
                              value={selectedInstances}
                              onChange={(event) => setSelectedInstances(event.target.value)}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip key={value} label={instances.find(option => option === value).instance} />
                                  ))}
                                </Box>
                              )}
                            >
                              {instances.map((option) => (
                                <MenuItem key={option.instance} value={option}>
                                  {option.instance}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <Grid container item spacing={2}>
                        <Grid item xs={isMobile ? 12 : 0} md={isMobile ? 12 : 4}>
                          <Typography variant="subtitle1" color="secondary" sx={{ mb: 1 }}>
                            NOME DA CAMPANHA
                          </Typography>
                          <TextField
                            label="Nome da Campanha"
                            name="name"
                            text
                            SelectProps={{
                              variant: 'outlined'
                            }}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                      <Grid item xs={isMobile ? 12 : 0} md={isMobile ? 12 : 4}>
                        <Typography variant="subtitle1" color="secondary" sx={{ mb: 1 }}>
                          EMPRESA
                        </Typography>
                        <TextField
                          label="Empresa"
                          name="company"
                          select
                          SelectProps={{
                            variant: 'outlined'
                          }}
                          fullWidth
                        >
                          <MenuItem value={userInfo.company}>{userInfo.company}</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid container item spacing={2}>
                        <Grid item xs={isMobile ? 12 : 0} md={isMobile ? 12 : 2}>
                          <input
                            type="file"
                            id="contained-button-file"
                            accept=".xlsx,.xls,.csv,.txt,.rem"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                          />
                          <Button
                            startIcon={selectedFile ? <CheckIcon /> : <UploadFileIcon />}
                            fullWidth
                            onClick={() => document.getElementById('contained-button-file').click()}
                            sx={{
                              height: theme.spacing(heightButton),
                              border: `1px solid ${selectedFile ? theme.palette.success.dark : theme.palette.primary.main}`,
                              color: selectedFile ? theme.palette.success.dark : theme.palette.primary.main
                            }}
                          >
                            {selectedFile ? 'Arquivo Enviado' : 'Enviar Arquivo'}
                          </Button>
                        </Grid>
                        <Grid item xs={isMobile ? 12 : 0} md={isMobile ? 12 : 2}>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AddCircleOutlineIcon />}
                            fullWidth
                            sx={{
                              height: theme.spacing(heightButton)
                            }}
                          >
                            Criar Campanha
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </form>
                </Grid>
              </Grid>
            </Grid>
          </MainCard>
        </>
      )}
    </>
  );
};

export default CriarCampanhas;
