import OpenAI from 'openai';
import styled from 'styled-components';
// @ts-ignore
import { marked } from 'marked';

export type Messages = OpenAI.Chat.Completions.ChatCompletionMessageParam & {_id: string}

const Wrapper = styled.div`
    display: flex;
    margin-bottom: 20px;
    .inner {
        max-width: 70%;
        font-size: 12px;
        color: #333;
        min-width: 0;
    }
    &.ai {
        justify-content: flex-start;
        .inner {

        }
    }
    &.person {
        justify-content: flex-end;
        .inner {
            white-space: pre-wrap;
            background-color: #fdede9;
            border-radius: 12px;
            padding: 12px;
        }
    }
`;

export function Bubble(props: Messages) {
    return <Wrapper key={props._id} className={props.role === 'assistant' ? 'ai' : 'person'}>
        { props.role === 'user'
            ? <div className='inner'>{props.content as string}</div>
            : <div className='inner' dangerouslySetInnerHTML={{ __html: marked.parse(props.content as string) }} />
        }
    </Wrapper>;
}