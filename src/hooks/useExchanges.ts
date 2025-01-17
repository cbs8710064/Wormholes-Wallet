import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { Toast } from "vant";
import { computed, onMounted, ref, Ref, watch } from "vue";
import { ethers } from "ethers";
import { ExchangeStatus, getWallet, TransactionReceipt, handleGetTranactionReceipt, TransactionTypes } from "@/store/modules/account";
import { hashMessage } from "@/utils/ether";
import { useSign } from "@/views/sign/hooks/sign";
import { web3 } from "@/utils/web3";
import { encode, decode } from 'js-base64';

import {
  createExchange,
  getSysParams,
  getExchangeSig,
  checkAuth,
  setExchangeSig,
  is_install
} from "@/http/modules/common";
const erbAbi = require("@/assets/json/erbAbi.json");
import { useTradeConfirm } from "@/plugins/tradeConfirmationsModal";
import router from "@/router";
import { useI18n } from "vue-i18n";
import { utils } from "ethers";
import i18n from "@/language/index";
import store from "@/store";
import BigNumber from "bignumber.js";
import { TradeStatus } from "@/plugins/tradeConfirmationsModal/tradeConfirm";


export const useExchanges = () => {
  const { $tradeConfirm } = useTradeConfirm()
  const showCreateExchange: Ref<boolean> = ref(false);
  const showExchange: Ref<boolean> = ref(false);
  const showExchange1: Ref<boolean> = ref(false);


  const exchangeUrl: Ref<string> = ref("");
  const adminUrl: Ref<string> = ref("");
  const ready: Ref<boolean> = ref(false);

  const { dispatch, state, commit, getters } = useStore();
  const { toSign, sign } = useSign();

  const sendTx2 = async (amount: any, callBack?: Function) => {
   try {
    const wallet = await getWallet()
    const contractWithSigner = await getContract();
    const { address } = wallet
    const data = await contractWithSigner.functions.payForRenew({
      value: ethers.utils.parseEther(amount + ''),
    });
    callBack ? callBack() : "";
    localStorage.setItem('tx2', JSON.stringify(data))
    // debugger
    $tradeConfirm.update({ status: "approve" })
    const receipt = await wallet.provider.waitForTransaction(data.hash)
    localStorage.setItem('receipt2', JSON.stringify(receipt))
    const symbol = state.account.currentNetwork.currencySymbol
    const rep: TransactionReceipt = handleGetTranactionReceipt(
      TransactionTypes.contract,
      receipt,
      data,
      symbol
    );
    const { status } = receipt;
    if (status == 0) {
      $tradeConfirm.update({ status: "fail" })
      resetData();
      Toast(i18n.global.t("userexchange.transactionfailed"));
      return Promise.reject()
    }
    dispatch("account/updateAllBalance");
    commit("account/PUSH_TRANSACTION", rep);
    return Promise.resolve(receipt)
   }catch(err){
    $tradeConfirm.update({ status: "fail" })
    console.log(err)
    console.log("==========err2=============")
    Toast(err.toString());
    resetData();
    return Promise.reject()
   }
  }

  const send2 = async (amount: number = 200, exchange_name: string, callBack = () => { }, isDialog = true) => {
    if(isDialog) {
      $tradeConfirm.open({
        approveMessage: i18n.global.t('createExchange.create_approve'),
        successMessage: i18n.global.t('createExchange.create_waiting'),
        wattingMessage: i18n.global.t('createExchange.create_success'),
        wattingTitle: i18n.global.t('createExchange.wattingTitle'),
        failMessage: i18n.global.t('createExchange.create_wrong'),
        callBack: () => { router.replace({ name: "exchange-management" }) },
        failBack: () => { router.replace({ name: "exchange-management" }) }
      })
    }

    const wallet = await getWallet()
    const {address} = wallet
    try {
      const receipt = await sendTx2(amount)
      const { status } = receipt;
      if (status == 0) {
        $tradeConfirm.update({ status: "fail" })
        resetData();
        Toast(i18n.global.t("userexchange.transactionfailed"));
        return;
      }
      const params = await generateSign(exchange_name);
      const sendData = {
        address,
        params: `'${JSON.stringify(params)}'`,
      };
      console.log(sendData)
      const val: any = await createExchange(sendData);
      if (val.code == "true") {
        let time = setTimeout(async () => {
          try {
            const data = await authExchange();
            ready.value = true;
            $tradeConfirm.update({ status: "success" })
            callBack ? callBack() : "";
          } catch (err: any) {
            $tradeConfirm.update({ status: "fail" })
            resetData();
          }
          clearTimeout(time);
        }, 8000);
      } else {
        resetData();
        $tradeConfirm.update({ status: "fail" })
      
        return;
      }
    //  let time2 = setTimeout(async() =>{
    //   const params = await generateSign(exchange_name);
    //   const sendData = {
    //     address,
    //     params: `'${JSON.stringify(params)}'`,
    //   };
    //   console.log(sendData)
    //   const val: any = await createExchange(sendData);
    //   if (val.code == "true") {
    //     let time = setTimeout(async () => {
    //       try {
    //         const data = await authExchange();
    //         ready.value = true;
    //         $tradeConfirm.update({ status: "success" })
    //         callBack ? callBack() : "";
    //       } catch (err: any) {
    //         $tradeConfirm.update({ status: "fail" })
    //         resetData();
    //       }
    //       clearTimeout(time);
    //     }, 8000);
    //   } else {
    //     resetData();
    //     $tradeConfirm.update({ status: "fail" })
    //     clearTimeout(time2)
    //     return;
    //   }
    //  },10000)
    } catch (err) {
      $tradeConfirm.update({ status: "fail" })
      resetData();
    }
  }

  /**
   * Generate a signed exchange authorization information
   */
  const generateSign = async (name: string) => {
    const wallet = await getWallet();
    const blockNumber = await wallet.provider.getBlockNumber();
    const exchanger_owner: string = wallet.address;
    const to: string = "0x7fBC8ad616177c6519228FCa4a7D9EC7d1804900";
    const exchange_name: string = name
    // const block_number: number = blockNumber + 86400;
    // const sign_exchange_owner = await wallet.signMessage(exchange_owner);
    // const sign_to = await wallet.signMessage(to);
    // const sign_block_number = await wallet.signMessage(block_number);
    const newstr = hashMessage(`${exchanger_owner}${to}${blockNumber}`)
    return new Promise((resolve, reject) => {
      toSign({
        sig: newstr,
        address: wallet.address,
        call: async (sigstr: string) => {
          const params = {
            type: "exchange_auth",
            exchange_name,
            // Authorized version (fixed)
            version: 1,
             // One Click Exchange founder's address (wallet address)
            exchanger_owner, 
           // Licensee's address (fixed address, provided by Li Gong)
            to, 
            // The block height of the chain at the time of authorization, which is used to determine the validity of the authorization (obtained from the block browser, if not, write first).
            block_number: blockNumber, 
            sig: sigstr,
          };
          resolve(params)
        },
      });
    })


  };

  // Even contract, issue trade
const getContract = async () => {
    const wallet = await getWallet();
    const { URL } = state.account.currentNetwork;
    let provider = ethers.getDefaultProvider(URL);
    const { abi } = erbAbi;
    const contractAddress = state.account.contractAddress
    if (!contractAddress) {
      throw new Error("error contractAddress cant't be null")
    }
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const contractWithSigner = contract.connect(wallet);
    return contractWithSigner
  };



  const resetData = () => {
    showExchange1.value = false;
    showCreateExchange.value = false;
    showExchange.value = false;
    ready.value = false;

  };

  // Send one click to open exchange trading
  const sendTo = async (name: string, amount: number, isServer: boolean, fee_rate?: number) => {
    const wallet = await getWallet();
    const exchangeStatus: ExchangeStatus = state.account.exchangeStatus
    const {
      status: newStatus,
      exchanger_flag
    } = exchangeStatus
    const { address } = wallet;
    const baseName = encode(name);
    try {
      const rate_str: number = fee_rate? new BigNumber(fee_rate).multipliedBy(10).toNumber() : 100
      const str = `wormholes:{"version": "0","type": 11,"fee_rate": ${rate_str},"name":"${baseName}","url":""}`;
      // const str = `wormholes:{"type":"9", "proxy_address":"0x591813F0D13CE48f0E29081200a96565f466B212", "version":"0.0.1"}`
      const data3 = toHex(str);
      const tx1 = {
        from: address,
        to: address,
        value: ethers.utils.parseEther(amount + ''),
        data: `0x${data3}`,
      };
      // debugger
      wallet.sendTransaction(tx1).then((receipt: any) => {
        const { hash } = receipt;
        localStorage.setItem('tx1', JSON.stringify(receipt))
        if(!isServer){
          $tradeConfirm.update({status:"approve"})
        }
        wallet.provider
          .waitForTransaction(hash).then(async (receipt2: any) => {
            const { status } = receipt2
            localStorage.setItem('receipt1', JSON.stringify(receipt2))
            const symbol = state.account.currentNetwork.currencySymbol
            const rep: TransactionReceipt = handleGetTranactionReceipt(
              TransactionTypes.default,
              receipt2,
              receipt,
              symbol
            );
            commit("account/PUSH_TRANSACTION", rep);
            if(!isServer) {
              if(status == 0) {
                $tradeConfirm.update({status:"fail"})
              } else {
                $tradeConfirm.update({status:"success",callBack(){router.replace({name:"exchange-management"})}})
              }
            }
            // Send the second stroke
            if (isServer) {
              if(!exchanger_flag && newStatus == 2){
                $tradeConfirm.update({status:"success",callBack(){router.replace({name:"exchange-management"})}})
                return
              }
              send2(200, name)
            }
          })

      }).catch((err: any) => {
        Toast(err.reason);
        if(!isServer){
          $tradeConfirm.update({status:"fail"})
        }
        resetData();

      });
    } catch (err: any) {
      if(!isServer){
        $tradeConfirm.update({status:"fail"})
      }
    }
  };

  // Miners pledge
  const sendToPledge = async (amount: number, proxy_address?: string) => {
    // const wallet = await getWallet();
    const wallet = await getWallet()
    const { address } = wallet;
    // const gasPrice = await wallet.provider.getGasPrice()
    $tradeConfirm.open({
      approveMessage: i18n.global.t('minerspledge.create_approve'),
      successMessage: i18n.global.t('minerspledge.create_waiting'),
      wattingMessage: i18n.global.t('minerspledge.create_success'),
      failMessage: i18n.global.t('minerspledge.create_wrong')
    })

    try {
      if (proxy_address) {
        const sigstr = `${proxy_address}${address}`
        // Agent pledge
        await toSign({
          address: proxy_address,
          sig: sigstr,
          isAdmin: false,
          call: (sign: string) => {
            debugger
            sendPledge(amount, proxy_address, sign)
          }
        })

        return
      }
      // Ordinary pledge
      sendPledge(amount, '', '')
    } catch (err: any) {
      console.error(err)
      $tradeConfirm.update({ status: "fail" })
    }
  };


  const sendPledge = async (amount: number, proxy_address: string, proxy_sign: string) => {
    try {
      const wallet = await getWallet()
      const { address } = wallet
      const str = `wormholes:{"type":9,"proxy_address":"${proxy_address}","proxy_sign":"${proxy_sign}","version":"v0.0.1"}`
      console.warn('str', str)
      const data3 = toHex(str);
      const tx1 = {
        to: address,
        value: ethers.utils.parseEther(amount + ''),
        data: `0x${data3}`,
      };
      console.warn('tx1', tx1)
      console.warn('amount', amount)


      const receipt: any = await wallet.sendTransaction(tx1)
      localStorage.setItem('tx', JSON.stringify(receipt))

      $tradeConfirm.update({ status: "approve" })
      const { hash } = receipt;
      const receipt2 = await wallet.provider.waitForTransaction(hash)

      const symbol = state.account.currentNetwork.currencySymbol
      const rep: TransactionReceipt = handleGetTranactionReceipt(
        TransactionTypes.default,
        receipt2,
        receipt,
        symbol
      );
      commit("account/PUSH_TRANSACTION", rep);
      const { status } = receipt2
      localStorage.setItem('receipt1', JSON.stringify(receipt2))
      if (status == 0) {
        $tradeConfirm.update({ status: "fail" })
        Toast(i18n.global.t('userexchange.transferfailed'))
        return false
      } else {
        localStorage.setItem('receipt', JSON.stringify(receipt2))
        $tradeConfirm.update({
          status: "success", callBack() {
            router.replace({ name: "wallet" })
          }
        })
      }
    } catch (err) {
      $tradeConfirm.update({ status: "fail" })
      console.error(err)
    }
  }

  /**
   * Authorized one-click exchange
   * @returns
   */
  const authExchange = async () => {
    const wallet = await getWallet();
    const number = await wallet.provider.getBlockNumber();
    const block_number = utils.hexlify((number) + 6307200);
    const { address } = wallet;
    // watting 30 s
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 30000)
    })
    const d: any = await getSysParams(address);
    const { exchangeraddr } = d.data;
    const newParams = {
      exchanger_owner: address,
      to: exchangeraddr,
      block_number,
    };
    const str = `${address}${exchangeraddr}${block_number}`;
    const newstr = hashMessage(str);
    return new Promise((resolve, reject) => {
      //@ts-ignore
      toSign({
        sig: newstr,
        address: wallet.address,
        call: async (sigstr: string) => {
          const params = { ...newParams, sig: sigstr }
          sessionStorage.setItem('params', JSON.stringify(params))
          setExchangeSig(wallet.address, params)
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            });
        },
      });
    });
  };

  // Querying Exchange Status
  /**
   *
   * @returns 
   *
   */
  const exchangeStatus = async () => {
    try {
      let wallet = await getWallet();
      const status = await checkAuth(wallet.address);
      return Promise.resolve(status.data);
    } catch (err) {
      console.error(err);
    }
  };

  // One click to open the exchange
  const createExchanges = async (name: string, amount: number,  fee_rate?: number) => {
    const exchangeStatus: ExchangeStatus = state.account.exchangeStatus
    const {
      status,
      exchanger_flag
    } = exchangeStatus
    console.log(status)
    console.log(exchanger_flag)
    if ((status != 2 && exchanger_flag == false) || (!exchanger_flag && status == 2)) {
      $tradeConfirm.open({
        approveMessage: i18n.global.t('createExchange.create_approve'),
        successMessage: i18n.global.t('createExchange.create_waiting'),
        wattingMessage: i18n.global.t('createExchange.create_success'),
        failMessage: i18n.global.t('createExchange.create_wrong')
      })
      sendTo(name, amount, true, fee_rate);
      return
    }
    // The first payment was made, the second was missed
    if (exchanger_flag == true && status != 2) {
      $tradeConfirm.open({
        approveMessage: i18n.global.t('createExchange.create_approve'),
        successMessage: i18n.global.t('createExchange.create_waiting'),
        wattingMessage: i18n.global.t('createExchange.create_success'),
        failMessage: i18n.global.t('createExchange.create_wrong')
      })
      send2(200, name)
    }
    if (!exchanger_flag && status == 2) {
      sendTo(name, amount, false, fee_rate);
    }
  };

  const closeExchanges = async () => {
    $tradeConfirm.open({
      approveMessage: i18n.global.t('minerspledge.close_approve'),
      successMessage: i18n.global.t('minerspledge.close_waiting'),
      wattingMessage: i18n.global.t('minerspledge.close_success'),
      failMessage: i18n.global.t('minerspledge.close_wrong')
    })
    const wallet = await getWallet();
    const { address } = wallet;
    const str = `wormholes:{"version":"0.0.1","type":12}`;
    const data3 = toHex(str);
    const tx1 = {
      from: address,
      to: address,
      value: ethers.utils.parseEther("0"),
      data: `0x${data3}`,
    };

    return new Promise((resolve, reject) => {
      wallet
        .sendTransaction(tx1)
        .then((receipt: any) => {
          $tradeConfirm.update({ status: "approve" })
          const { hash } = receipt;
          localStorage.setItem("close-exchange-tx", JSON.stringify(receipt));
          wallet.provider
            .waitForTransaction(hash)
            .then(async (receipt2: any) => {
              const symbol = state.account.currentNetwork.currencySymbol
              const rep: TransactionReceipt = handleGetTranactionReceipt(
                TransactionTypes.default,
                receipt2,
                receipt,
                symbol
              );
              commit("account/PUSH_TRANSACTION", rep);
              await dispatch("account/getExchangeStatus");
              resolve(receipt2);
              const { status } = receipt2
              if (status == 0) {
                $tradeConfirm.update({ status: "fail" })
              } else {
                $tradeConfirm.update({ status: "success", callBack() { router.replace({ name: "wallet" }) } })
              }
            }).catch((err: any) => {
              $tradeConfirm.update({ status: "fail" })
            });
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  };

  // Sending Authorization Information
  const sendAuthData = async (address: string) => {
    try {
      const d: any = await getSysParams(address);
      const data = await authExchange();
    } catch (err) {

    }
  };

  // When both trades are successful, check whether the exchange was successfully generated, if not continue to follow the later process
  const initExchangeData = async () => {
    const wallet = await getWallet()
    const { address } = wallet
    const res = await wallet.provider.send('eth_getAccountInfo', [address, "latest"])
    const { ExchangerName, BlockNumber } = res
    let exchange_name = decode(ExchangerName);
    try {
      // If the exchange is not successfully deployed, redeploy it
      const installData = await is_install(address)
      // Check whether setExchangeSig is successfully sent. If no setExchangeSig is sent, send it again

      const data = await getExchangeSig(address)
      if (installData.code == 'true' && !data.data) {
        sendAuthData(address)
      }
    } catch (err) {
      // The exchange failed to deploy successfully, redeploy, and sign to the backend
      const params = await generateSign(exchange_name);
      // Send data to open an exchange
      const sendData = {
        address,
        params: `'${JSON.stringify(params)}'`,
      };
      // Send to the one-click exchange interface
      const val: any = await createExchange(sendData);
      if (val.code == "true") {
        let time = setTimeout(async () => {
          sendAuthData(address)
          clearTimeout(time);
        }, 30000);
      }
    }

  }

  // Modify the escrow service fee/pledge amount
  const modifExchangeBalance = async (
    name: string,
    callBack = () => { }
  ) => {
    // Send the second hosting fee
    try {
      await send2(200, name);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve();
  };




// Add the pledge amount  
  const addExchangeBalance = async (
    amount: number,
  ) => {
    debugger
    const wallet = await getWallet();
    const { address } = wallet;
   // Add the pledge amount
    const str = `wormholes:{"version": "0.0.1","type": 21}`;
    const data3 = toHex(str);
    const tx1 = {
      from: address,
      to: address,
      value: ethers.utils.parseEther(amount + ""),
      data: `0x${data3}`,
    };
    $tradeConfirm.open({
      callBack: () => {
        router.replace({ name: 'wallet' })
      },
      failBack: () => {
        router.replace({ name: 'wallet' })
      }
    })
    // Send the first pledge amount
    try {
      const data1 = await wallet.sendTransaction(tx1);
      $tradeConfirm.update({ status: TradeStatus.approve })
      localStorage.setItem("data1", JSON.stringify(data1));
      const receipt1 = await wallet.provider.waitForTransaction(data1.hash);
      const symbol = state.account.currentNetwork.currencySymbol
      const rep: TransactionReceipt = handleGetTranactionReceipt(
        TransactionTypes.default,
        receipt1,
        data1,
        symbol
      );
      dispatch("account/updateAllBalance");
      commit("account/PUSH_TRANSACTION", rep);
      $tradeConfirm.update({ status: TradeStatus.success })
      localStorage.setItem("tx1", JSON.stringify(receipt1));
    } catch (err) {
      $tradeConfirm.update({ status: TradeStatus.fail })
      return Promise.reject(err);
    }
    return Promise.resolve();
  };

  // Reduce the amount pledged
  const miunsExchangeBalance = async (amount: number) => {
    const wallet = await getWallet();
    const { address } = wallet;
    const str = `wormholes:{"type":22,"version":"v0.0.1"}`;
    const data3 = toHex(str);
    const tx1 = {
      from: address,
      to: address,
      value: ethers.utils.parseEther(amount + ""),
      data: `0x${data3}`,
    };
    $tradeConfirm.open({
      callBack: () => {
        router.replace({ name: 'wallet' })
      },
      failBack: () => {
        router.replace({ name: 'wallet' })
      }
    })
    try {
      const data1 = await wallet.sendTransaction(tx1);
      $tradeConfirm.update({ status: TradeStatus.approve })
      localStorage.setItem("data1", JSON.stringify(data1));
      const receipt1 = await wallet.provider.waitForTransaction(data1.hash);
      $tradeConfirm.update({ status: TradeStatus.success })
      const symbol = state.account.currentNetwork.currencySymbol
      const rep: TransactionReceipt = handleGetTranactionReceipt(
        TransactionTypes.default,
        receipt1,
        data1,
        symbol
      );
      dispatch("account/updateAllBalance");
      commit("account/PUSH_TRANSACTION", rep);
      localStorage.setItem("tx1", JSON.stringify(receipt1));
    } catch (err) {
      $tradeConfirm.update({ status: TradeStatus.fail })
      return Promise.reject(err);
    }
  }
  return {
    createExchanges,
    showCreateExchange,
    showExchange,
    showExchange1,
    exchangeUrl,
    adminUrl,
    ready,
    generateSign,
    exchangeStatus,
    close,
    closeExchanges,
    sendTo,
    sendToPledge,
    initExchangeData,
    modifExchangeBalance,
    addExchangeBalance,
    miunsExchangeBalance,
    send2,
    sendTx2,
    getContract
  };
};

export function toHex(str: string) {
  if (str === "") return "";
  var hexCharCode = [];
  for (var i = 0; i < str.length; i++) {
    hexCharCode.push(str.charCodeAt(i).toString(16));
  }
  return hexCharCode.join("");
}
