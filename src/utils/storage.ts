interface StoredMazeConfig {
  grid: {
    isPath: boolean;
    isRevealed: boolean;
    isActive: boolean;
    isElectric?: boolean;
  }[][];
  name: string;
  createdAt: number;
}

const STORAGE_KEY = 'electric-maze-configs';

export const saveMazeConfig = (grid: StoredMazeConfig['grid'], name: string): void => {
  console.log('💾 SAVE MAZE CONFIG - Starting save process...');
  console.log('📋 Grid to save:', grid);
  console.log('🏷️ Config name:', name);
  
  // Count squares in the grid being saved
  let pathCount = 0;
  let electricCount = 0;
  let revealedCount = 0;
  
  grid.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      if (square.isPath) {
        pathCount++;
        console.log(`✅ Saving path square at [${rowIndex},${colIndex}]:`, square);
      }
      if (square.isElectric) {
        electricCount++;
        console.log(`⚡ Saving electric square at [${rowIndex},${colIndex}]:`, square);
      }
      if (square.isRevealed) {
        revealedCount++;
      }
    });
  });
  
  console.log(`📊 Grid Summary Being Saved: ${pathCount} path, ${electricCount} electric, ${revealedCount} revealed squares`);
  
  const configs = getMazeConfigs();
  console.log('📚 Existing configs count:', configs.length);
  
  const newConfig: StoredMazeConfig = {
    grid,
    name,
    createdAt: Date.now()
  };
  
  console.log('🆕 New config object created:', {
    name: newConfig.name,
    createdAt: new Date(newConfig.createdAt).toLocaleString(),
    gridSize: `${newConfig.grid.length}x${newConfig.grid[0]?.length || 0}`
  });
  
  configs.push(newConfig);
  console.log('📚 Updated configs count:', configs.length);
  
  // BREAKPOINT 4: Pause before localStorage save
  debugger; // Inspect 'configs' array and 'newConfig' before saving
  
  const jsonString = JSON.stringify(configs);
  console.log('📝 JSON string length:', jsonString.length, 'characters');
  console.log('🔍 JSON preview (first 200 chars):', jsonString.substring(0, 200) + '...');
  
  localStorage.setItem(STORAGE_KEY, jsonString);
  console.log('✅ Successfully saved to localStorage with key:', STORAGE_KEY);
  
  // Verify the save worked
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    const parsedConfigs = JSON.parse(savedData);
    console.log('✅ Verification: localStorage now contains', parsedConfigs.length, 'configs');
    console.log('🎯 Last saved config:', parsedConfigs[parsedConfigs.length - 1]?.name);
  } else {
    console.error('❌ Verification failed: No data found in localStorage');
  }
};

export const getMazeConfigs = (): StoredMazeConfig[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const deleteMazeConfig = (name: string): void => {
  const configs = getMazeConfigs();
  const filtered = configs.filter(config => config.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const loadMazeConfig = (name: string): StoredMazeConfig | null => {
  const configs = getMazeConfigs();
  const config = configs.find(c => c.name === name);
  return config || null;
};

export const exportMazeConfigs = (): void => {
  const configs = getMazeConfigs();
  const jsonString = JSON.stringify(configs, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `electric-maze-configs-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importMazeConfigs = async (file: File): Promise<boolean> => {
  try {
    const text = await file.text();
    const configs = JSON.parse(text) as StoredMazeConfig[];
    
    // Validate the imported data
    const isValid = configs.every(config => 
      config.grid?.length === 8 &&
      config.grid[0]?.length === 8 &&
      config.name &&
      config.createdAt
    );
    
    if (!isValid) {
      throw new Error('Invalid configuration format');
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    return true;
  } catch (error) {
    console.error('Failed to import configurations:', error);
    return false;
  }
};
