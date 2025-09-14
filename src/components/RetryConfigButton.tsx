import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRetryConfig } from '../context/RetryConfigContext';

const RetryConfigButton: React.FC = () => {
  const { openSettings } = useRetryConfig();

  return (
    <Tooltip title="Retry Settings">
      <IconButton onClick={openSettings} size="small">
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  );
};

export default RetryConfigButton;
