import { SyncOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100%;
    .title {
        color: #333;
        font-size: 14px;
        letter-spacing: 1px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        .anticon {
            color: #949494;
            cursor: pointer;
        }
    }
`;

export function Fund() {
    function handleReloadFund() {
        
    }
    return <Wrapper className="box">
        <div className='title'>
            基金
            <SyncOutlined onClick={handleReloadFund} />
        </div>
    </Wrapper>;
}