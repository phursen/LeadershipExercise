import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMaze } from '../context/MazeContext';
import { useSocketStatus } from '../context/SimpleSocketStatusContext';
import { useRetryConfig } from '../context/RetryConfigContext';
import { createSocketPromise, SocketTimeoutError } from '../utils/socketUtils';

interface GameState {
  grid: Array<Array<{
    isPath: boolean;
    isRevealed: boolean;
    isActive: boolean;
  }>>;
  teams: string[];
  currentTeam: string;
}

import { SOCKET_CONFIG } from '../config/socket';

export const useSocket = () => {
  const { 
    setSquareStatus, 
    addTeam, 
    setCurrentTeam, 
    resetMaze 
  } = useMaze();
  const { startOperation, endOperation, setConnected } = useSocketStatus();
  const { config: retryConfig } = useRetryConfig();

  const socketRef = useRef<Socket>();

  useEffect(() => {
    socketRef.current = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('connect', () => {
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('connect_error', () => {
      setConnected(false);
    });

    // Handle initial game state
    socketRef.current.on('gameState', (state: GameState) => {
      state.grid.forEach((row, rowIndex: number) => {
        row.forEach((square: { isPath: boolean; isRevealed: boolean; isActive: boolean }, colIndex: number) => {
          setSquareStatus(rowIndex, colIndex, square);
        });
      });
      state.teams.forEach((team: string) => addTeam(team));
      if (state.currentTeam) {
        setCurrentTeam(state.currentTeam);
      }
    });

    // Handle square updates
    socketRef.current.on('squareUpdated', ({ row, col, status }) => {
      setSquareStatus(row, col, status);
    });

    // Handle team updates
    socketRef.current.on('teamAdded', (teamName: string) => {
      addTeam(teamName);
    });

    // Handle current team changes
    socketRef.current.on('currentTeamChanged', (teamName: string) => {
      setCurrentTeam(teamName);
    });

    // Handle maze reset
    socketRef.current.on('mazeReset', () => {
      resetMaze();
    });

    const socket = socketRef.current;
    return () => {
      socket.removeAllListeners();
    };
  }, [setSquareStatus, addTeam, setCurrentTeam, resetMaze]);

  const emitSquareUpdate = useCallback(async (row: number, col: number, status: any) => {
    try {
      startOperation('Updating square');
      await createSocketPromise(
        socketRef.current!,
        'updateSquare',
        { row, col, status },
        'Update square',
        retryConfig
      );
      endOperation();
    } catch (error) {
      const message = error instanceof SocketTimeoutError
        ? 'Square update timed out. Please try again.'
        : 'Failed to update square';
      endOperation(message);
    }
  }, [startOperation, endOperation, retryConfig]);

  const emitAddTeam = useCallback(async (teamName: string) => {
    try {
      startOperation('Adding team');
      await createSocketPromise(
        socketRef.current!,
        'addTeam',
        teamName,
        'Add team',
        retryConfig
      );
      endOperation();
    } catch (error) {
      const message = error instanceof SocketTimeoutError
        ? 'Team creation timed out. Please try again.'
        : 'Failed to add team';
      endOperation(message);
    }
  }, [startOperation, endOperation, retryConfig]);

  const emitSetCurrentTeam = useCallback(async (teamName: string) => {
    try {
      startOperation('Changing active team');
      await createSocketPromise(
        socketRef.current!,
        'setCurrentTeam',
        teamName,
        'Change team',
        retryConfig
      );
      endOperation();
    } catch (error) {
      const message = error instanceof SocketTimeoutError
        ? 'Team change timed out. Please try again.'
        : 'Failed to change team';
      endOperation(message);
    }
  }, [startOperation, endOperation, retryConfig]);

  const emitResetMaze = useCallback(async () => {
    try {
      startOperation('Resetting maze');
      await createSocketPromise(
        socketRef.current!,
        'resetMaze',
        null,
        'Reset maze',
        retryConfig
      );
      endOperation();
    } catch (error) {
      const message = error instanceof SocketTimeoutError
        ? 'Maze reset timed out. Please try again.'
        : 'Failed to reset maze';
      endOperation(message);
    }
  }, [startOperation, endOperation, retryConfig]);

  return {
    emitSquareUpdate,
    emitAddTeam,
    emitSetCurrentTeam,
    emitResetMaze
  };
};
