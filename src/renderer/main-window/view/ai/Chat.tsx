import { ArrowUpOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { memo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { debounce } from 'lodash';
import { Bubble, Messages } from './components/Bubble';
import { COLORS } from '../../utils/color';


const Wrapper = styled.div`
    height: 60vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 6px;
    .body {
        flex: 1;
        min-height: 0;
        overflow-y: scroll;
        position: relative;
        .empty {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18px;
            color: #333;
            font-weight: 600;
            letter-spacing: 1px;
        }
    }
    .tools {
        border: 1px solid #e3e3e3;
        border-radius: 12px;
        flex: 0 0 40px;
        padding: 8px 4px;
        box-shadow: 0 2px 10px #ededed;
        .ant-input {
            resize: none;
        }
        .btn {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-inline: 10px;
        }
    }
    .thinking {
        font-size: 12px;
        color: #333;
        margin-bottom: 20px;
        .anticon {
            margin-right: 10px;
        }
    }
`;

export const ChatContent = memo(() => {
    const [thinking, setThinking] = useState(false);
    const [messages, setMessages] = useState<Messages[]>([]);
    useEffect(() => {
        getAIMesssages();
        window.electron.ipcRenderer.on('chat-thinking-status', (data: any) => {
            setThinking(data);
            if(data) {
                scrollToBottom();
            }
        });
        const handleMessageChange = debounce((data) => {
            if(Array.isArray(data)) {
                setMessages(data.filter(i => i.role === 'user' || i.role === 'assistant'));
            }
        }, 80);
        window.electron.ipcRenderer.on('chat-message-change', handleMessageChange);
    }, []);

    async function getAIMesssages() {
        const result = await window.electron.ipcRenderer.invoke('get-ai-messages');
        if(result) {
            setMessages(result.filter((i: any) => i.role === 'user' || i.role === 'assistant'));
        }
    }

    const containerRef = useRef<HTMLDivElement>(null);
    function isNearBottom() {
        if(!containerRef.current) return false;
        return containerRef.current!.scrollHeight - containerRef.current!.scrollTop - containerRef.current!.clientHeight < 300;
    }
    useEffect(() => {
        if(!messages.length || !isNearBottom()) return;
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        containerRef.current?.scrollTo({
            top: containerRef.current!.scrollHeight, behavior: 'smooth'
        });
    }
    
    const [value, setValue] = useState('');
    async function handleSendMessage() {
        if(!value) return;
        window.electron.ipcRenderer.invoke('add-user-message', value);
        setValue('');
    }
    return <Wrapper>
        <div ref={containerRef} className='body'>
            {!thinking && !messages.length && <div className='empty'>有什么可以帮助您？</div>}
            {messages.map(msg => <Bubble {...msg} />)}
            {thinking && <div className='thinking'><LoadingOutlined color={COLORS.win} /></div>}
        </div>
        <div className='tools'>
            <Input.TextArea value={value} onChange={(e) => setValue(e.target.value)} variant='borderless' autoSize={{ minRows: 2, maxRows: 6 }} />
            <div className='btn'>
                <Button disabled type='text' size='small' icon={<LinkOutlined />} />
                <Button disabled={thinking} type='primary' shape='circle' size='small' icon={<ArrowUpOutlined />} onClick={handleSendMessage} />
            </div>
        </div>
    </Wrapper>;
});