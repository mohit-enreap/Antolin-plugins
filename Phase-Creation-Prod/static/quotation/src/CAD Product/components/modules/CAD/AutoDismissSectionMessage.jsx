import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import SectionMessage, { SectionMessageAction } from '@atlaskit/section-message';

const shrink = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`;

const ToastWrapper = styled.div`
  max-width: 400px;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  margin-bottom: 8px;

  & > div {
    padding-top: 8px !important;
    padding-bottom: 12px !important;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  transform: scaleY(0.4); /* Reduces vertical scale by 60% */
  transform-origin: bottom;
  background-color: ${props => props.appearance === 'success' ? '#00875A' : '#DE350B'};
  animation: ${shrink} ${props => props.duration}ms linear forwards;
`;

export const AutoDismissSectionMessage = ({
    errorMessage,
    title = "Notice",
    appearance = "error",
    onClose,
    duration = 5000
}) => {
    useEffect(() => {
        if (!errorMessage) return;

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [errorMessage, duration, onClose]);

    if (!errorMessage) return null;

    return (
        <ToastWrapper>
            <SectionMessage
                title={title}
                appearance={appearance}
                actions={[
                    <SectionMessageAction key="dismiss" onClick={onClose}>
                        Dismiss
                    </SectionMessageAction>
                ]}
            >
                {errorMessage}
            </SectionMessage>

            <ProgressBar duration={duration} appearance={appearance} />
        </ToastWrapper>
    );
};