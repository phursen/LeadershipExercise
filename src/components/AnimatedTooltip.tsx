import React from 'react';
import { Tooltip, TooltipProps, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const AnimatedTooltipContent = styled('div')`
  animation: ${fadeIn} 0.2s ease-out;
`;

interface AnimatedTooltipProps extends Omit<TooltipProps, 'children'> {
  children: React.ReactElement;
}

const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({ children, ...props }) => {
  return (
    <Tooltip
      {...props}
      componentsProps={{
        popper: {
          sx: {
            '& .MuiTooltip-tooltip': {
              bgcolor: 'rgba(0, 0, 0, 0.87)',
              padding: '8px 12px',
              fontSize: '0.875rem',
              maxWidth: 300,
              borderRadius: 1.5
            }
          }
        }
      }}
      TransitionProps={{
        timeout: 200
      }}
    >
      <div>
        {React.cloneElement(children, {
          onMouseEnter: (e: React.MouseEvent) => {
            if (children.props.onMouseEnter) {
              children.props.onMouseEnter(e);
            }
          }
        })}
      </div>
    </Tooltip>
  );
};

export default AnimatedTooltip;
