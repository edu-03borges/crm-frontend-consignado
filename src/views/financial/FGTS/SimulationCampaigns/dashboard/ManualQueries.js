import PropTypes from 'prop-types';

import { Avatar, Box, Grid, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import MainCard from 'ui-component/cards/MainCard';
import SkeletonCardsBox from 'ui-component/cards/Skeleton/CardsBox';

import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';

const CardWrapper = styled(MainCard)(() => ({
  //backgroundColor: theme.palette.secondary.dark,
  color: '#fff',
  overflow: 'hidden',
  position: 'relative'
}));

const ManualQueries = ({ isLoading }) => {
  const theme = useTheme();

  return (
    <>
      {isLoading ? (
        <SkeletonCardsBox />
      ) : (
        <CardWrapper border={false} content={false}>
          <Box sx={{ p: 2.25 }}>
            <Grid container direction="column">
              <Grid item>
                <Grid container alignItems="center">
                  <Grid item>
                    <Avatar
                      variant="rounded"
                      sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.largeAvatar,
                        backgroundColor: '#D6F6FD',
                        mt: 1
                      }}
                    >
                      <QueryBuilderIcon style={{ color: '#58B9D1' }} />
                    </Avatar>
                  </Grid>
                  <Grid item sx={{ ml: 2 }}>
                    <Typography sx={{ fontSize: 22, color: theme.palette.primary.dark, fontWeight: 500, mr: 1, mt: 1.75, mb: 0.75 }}>
                      0
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item>
                <Grid container alignItems="center">
                  <Grid item>
                    <Typography sx={{ fontSize: 18, color: theme.palette.primary.dark, fontWeight: 500, mr: 1, mt: 1.75, mb: 0.75 }}>
                      Consultas na Manual
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ mb: 1.25 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 300,
                    color: theme.palette.grey[500]
                  }}
                >
                  Média por solicitação
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardWrapper>
      )}
    </>
  );
};

ManualQueries.propTypes = {
  isLoading: PropTypes.bool
};

export default ManualQueries;
