import { httpGet, httpPost } from '../request'

export const isProduct = process.env.NODE_ENV == 'production' || process.env.NODE_ENV == '235' ? true : false
const api = isProduct ? '' : '/createExchange'
const serviceApi = '/serviceApi'
const wormholesApi = isProduct ? '' : '/wormholesApi'
const exchangeApi = isProduct ?'':'/exchangeApi'
const exchansApi = isProduct ? '' : '/exchans'
// Create an exchange with one click
export const createExchange = (data: any) => {
    return httpGet(`${api}/install/do_conf`, data)
}

// Example Query whether the exchange is generated successfully
export const is_install = (address: string) => {
    return httpGet(`${api}/install/is_install`, { address: address.toLowerCase() },null,false)
}

// Get the contract address
export const get_contract = () => {
    return httpGet(`${api}/install/contract`)
}

// Obtaining Account Information
export const getAccountInfo = (address: string) => {
    return httpPost('/nodeApi', { jsonrpc: "2.0", method: "eth_getAccountInfo", params: [address, "latest"], id: 20211209 })
}

// Queries whether hosting fees have been sent
export const issuccessdeal = (address: string) => {
    return httpGet(`${serviceApi}/issuccessdeal`, { address: address.toLowerCase() })

}

//Example Query details about an NFT asset
export const nftaddress = (owneraddress: string) => {
    return httpGet(`${serviceApi}/nftaddress`,{owneraddress})
}

// Example Query the NFT asset list of an address http://192.168.1.237:8090/ownernft?owneraddress=0x876589A88e2fAC09f5D5a23b6B5639B27A63120d
export const owneraddress = (owneraddress: string) => {
    return httpGet(`${serviceApi}/ownernft`,{owneraddress})
}


// One-click exchange to get the address
export const getSysParams = (address: string, params = {}) => {
    return httpGet(`${exchangeApi}/c${address.toLowerCase()}/v2/querySysParams`, params)
}

/**
 * Query exchange signature data
 * @param address 
 * @param params 
 * @returns boolean
 */
export const getExchangeSig = (address: string, params = {}) => {
    return httpGet(`${exchangeApi}/c${address.toLowerCase()}/v2/getExchangeSig`, params)
}


// Setting System Information
export const modifySysParams = (address: string, params = {}) => {
    console.log('params', JSON.stringify(params))
    return httpPost(`${exchangeApi}/c${address.toLowerCase()}/v2/modifySysParams`, params)
}

// Set System information Set one-click exchange data
export const setExchangeSig = (address: string, params = {}) => {
    console.log('params', JSON.stringify(params))
    return httpPost(`${exchangeApi}/c${address.toLowerCase()}/v2/setExchangeSig`, params)
}

// Get the smart contract address
export const getContractAddress = () => {
    return httpGet(`https://www.wormholesscan.com/ERBPay.json?${new Date().getTime()}`)
}

// const contractApi = isProduct ? 'contractApi' : 'contractApi'
const contractApi = isProduct ? 'contractApi' : 'contractApi'

export const checkAuth = (address: string) => {
    return httpGet(`${contractApi}/extra/checkAuth`,{address})
}


// Get user NFT reward information  nftaward/v1/queryuseraward
export const queryuseraward = (user_addr: string) => {
    return httpPost(`${exchansApi}/nftaward/v1/queryuseraward`,{user_addr})
}


/**
 * receive award /v1/receiveuseraward
 * award_type erb/snft/exchange
 * @param {user_addr}
 * @param {award_type}
 * @returns 
 */
export const receiveuseraward = (params: any) => {
    return httpPost(`${exchansApi}/nftaward/v1/receiveuseraward`, params)
}


