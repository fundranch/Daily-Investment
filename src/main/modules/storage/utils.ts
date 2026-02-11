// import { StorageData } from "../../../types";

// // 处理持有基金变更
// export function handleChangeFund(
//     data: StorageData,
//     fundType: 'hold' | 'self-selected',
//     handleType: 'add' | 'edit' | 'delete',
//     passData?: { label: string, value: string }
// ) {
//     const handleData = structuredClone(data)
//     const targetData = handleData[fundType === 'hold' ? 'holdFunds' : 'selfSelectedFunds'] 
//     if(handleType === 'add' && passData) {
//         targetData.push({ name: passData.label, code: passData.value })
//     }
// }

// // 处理自选基金
// export function handleChangeSelfSelectedFund() {

// }