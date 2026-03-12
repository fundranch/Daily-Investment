import { Button, Modal } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { RobotFilled } from '@ant-design/icons';
import styled from 'styled-components';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';
import { eventBus } from '../../utils/event';
import { COLORS } from '../../utils/color';
import { ChatContent } from './Chat';

const Title = styled.div`
    user-select: none;
    color: ${COLORS.win};
    .anticon {
        font-size: 14px;
        margin-right: 5px;
    }
`;

const Wrapper = styled.div<{thinking: boolean}>`
    position: relative;
    overflow: hidden;
    border-radius: 6px;
    outline: none;
    &::before {
        content: '';
        width: 200%;
        aspect-ratio: 1;  /* 保证是正方形 */
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(0deg);
        transform-origin: center;
        position: absolute;
        background: ${`conic-gradient(from 0deg, transparent ,${COLORS.win}, transparent)`};
        animation: spin ${({ thinking }) => thinking ? 1 : 4}s linear infinite;
        opacity: ${({ thinking }) => thinking ? 1 : 0.4};
    } 
    .inner {
        padding: 2px;
    }
    @keyframes spin {
        from {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }
`;

export function AIChat() {
    const [open, setOpen] = useState(false);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const [disabled, setDisabled] = useState(true);
    const draggleRef = useRef<HTMLDivElement>(null!);
    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if(!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };
    const [thinking, setThinking] = useState(false);
    useEffect(() => {
        function openAi() {
            setOpen(true);
        }
        eventBus.on('open-ai', openAi);
        window.electron.ipcRenderer.on('chat-thinking-status', (data: any) => {
            setThinking(data);
        });
        return () => {
            eventBus.removeListener('open-ai', openAi);
        };
    }, []);

    function handleCancel() {
        setOpen(false);
    }
    return <div>
        <Modal
            open={open}
            destroyOnHidden
            closeIcon={null}
            title={
                <Title
                    onMouseOver={() => disabled && setDisabled(false)}
                    onMouseOut={() => setDisabled(true)}>
                    <RobotFilled />小金助手
                </Title>}
            onCancel={handleCancel}
            footer={<Button size='small' type="primary" onClick={() => setOpen(false)}>退出</Button>}
            styles={{
                container: { backgroundColor: '#fdf9f8'  }
            }}
            classNames={{ root: 'ai-chat-modal' }}
            modalRender={(modal) => (
                <Draggable
                    disabled={disabled}
                    bounds={bounds}
                    nodeRef={draggleRef}
                    onStart={(event, uiData) => onStart(event, uiData)}
                >
                    <Wrapper thinking={thinking} ref={draggleRef}><div className='inner'>{modal}</div></Wrapper>
                </Draggable>
            )}
        >
            <ChatContent />
        </Modal>
    </div>;
}