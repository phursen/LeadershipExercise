interface TeamStats {
  explored: Set<string>;
  mistakes: number;
  startTime?: number;
  completionTime?: number;
}

interface ExportData {
  sessionDate: string;
  teams: {
    name: string;
    stats: {
      explored: number;
      mistakes: number;
      accuracy: number;
      completionTime: string;
      elapsedTime: string;
    };
  }[];
  mazeSize: {
    rows: number;
    columns: number;
  };
}

export const generateExportData = (
  teams: string[],
  teamStats: Record<string, TeamStats>,
  grid: any[][]
): ExportData => {
  const exportData: ExportData = {
    sessionDate: new Date().toISOString(),
    teams: [],
    mazeSize: {
      rows: grid.length,
      columns: grid[0].length
    }
  };

  teams.forEach(teamName => {
    const stats = teamStats[teamName];
    if (!stats) return;

    const elapsedTime = stats.startTime
      ? (stats.completionTime || Date.now()) - stats.startTime
      : 0;

    const accuracy = stats.explored.size > 0
      ? ((stats.explored.size - stats.mistakes) / stats.explored.size) * 100
      : 0;

    exportData.teams.push({
      name: teamName,
      stats: {
        explored: stats.explored.size,
        mistakes: stats.mistakes,
        accuracy: Math.round(accuracy * 100) / 100,
        completionTime: stats.completionTime 
          ? new Date(stats.completionTime).toISOString()
          : 'Incomplete',
        elapsedTime: new Date(elapsedTime).toISOString().substr(11, 8)
      }
    });
  });

  return exportData;
};

export const downloadSessionResults = (data: ExportData): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `electric-maze-session-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
