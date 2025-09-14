import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { generateExportData, downloadSessionResults } from '../utils/export';
import { useMaze } from '../context/MazeContext';

interface TeamMetrics {
  name: string;
  explored: number;
  mistakes: number;
  completionTime?: number;
  elapsedTime: number;
  accuracy: number;
}

const Analytics: React.FC = () => {
  const { grid, teams, getTeamStats, teamStats } = useMaze();

  const handleExport = () => {
    const exportData = generateExportData(teams, teamStats, grid);
    downloadSessionResults(exportData);
  };
  
  const calculateTeamMetrics = (teamName: string): TeamMetrics => {
    const stats = getTeamStats(teamName);
    const totalSquares = grid.flat().length;
    const pathSquares = grid.flat().filter(square => square.isPath).length;
    
    const now = Date.now();
    const elapsedTime = stats.startTime
      ? (stats.completionTime || now) - stats.startTime
      : 0;

    const accuracy = stats.explored.size > 0
      ? ((stats.explored.size - stats.mistakes) / stats.explored.size) * 100
      : 0;
    
    return {
      name: teamName,
      explored: stats.explored.size,
      mistakes: stats.mistakes,
      completionTime: stats.completionTime,
      elapsedTime,
      accuracy
    };
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'error';
    if (progress < 70) return 'warning';
    return 'success';
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Team Progress & Analytics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="small"
        >
          Export Results
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Explored</TableCell>
              <TableCell align="right">Accuracy</TableCell>
              <TableCell align="right">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => {
              const metrics = calculateTeamMetrics(team);
              const progressPercent = (metrics.explored / grid.flat().length) * 100;
              const timeDisplay = metrics.completionTime
                ? new Date(metrics.elapsedTime).toISOString().substr(14, 5)
                : '--:--';

              return (
                <TableRow 
                  key={team}
                  sx={{
                    backgroundColor: metrics.completionTime 
                      ? 'rgba(76, 175, 80, 0.1)'
                      : 'transparent'
                  }}
                >
                  <TableCell>{team}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progressPercent}
                        color={getProgressColor(progressPercent)}
                        sx={{ width: '100%', height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {Math.round(progressPercent)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {metrics.explored}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {metrics.mistakes} mistakes
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {Math.round(metrics.accuracy)}%
                  </TableCell>
                  <TableCell align="right">{timeDisplay}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default Analytics;
