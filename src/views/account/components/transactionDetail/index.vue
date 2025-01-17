<template>
  <div class="transaction-detail">
    <div class="title f-16 text-center">{{t('transactionDetails.transationHistoryDetails')}}</div>
    <div class="tran-form  mt-20">
      <div class="form-box ml-14 mr-14">
        <div class="card flex between card-border">
          <div class="label">{{t('transactionDetails.status')}}</div>
          <div :class="`value flex right center-v status${data.status}`">
            <span>{{ transactionStatus(data.status) }}</span>
          </div>
        </div>
        <div class="card flex between card-border">
          <div class="label">{{t('transactionDetails.date')}}</div>
          <div class="value">
            {{ formatDate(data.date, "MM/DD") }}
            {{$t('transactionDetails.at')}}
            {{ formatDate(data.date, "HH:mm ") }}
          </div>
        </div>
        <div class="card flex between smallpad">
          <div class="label">{{t('transactionDetails.from')}}</div>
          <div class="value">{{ addressMask(data.from) }}</div>
        </div>
        <div class="card flex between  card-border smallpad2">
          <div class="label">{{t('transactionDetails.to')}}</div>
          <div class="value">{{ addressMask(data.to) }}</div>
        </div>
        <div class="card flex between  card-border">
          <div class="label">{{t('transactionDetails.nonce')}}</div>
          <div class="value">#{{ data.nonce }}</div>
        </div>
        <div class="card flex between card-sml pt-10">
          <div class="label">{{t('transactionDetails.transferAmount')}}</div>
          <div class="value">{{ utils.formatEther(data.value) }} {{currentNetwork.currencySymbol}}</div>
        </div>
        <div class="card flex between card-sml">
          <div class="label">{{t('transactionDetails.gasfee')}}
                      <van-popover v-model:show="showPopover" theme="dark" placement="top-start" >
              <div class="f-12 pl-10 pr-10 pt-10 pb-10" @click="showPopover = false">{{t('common.gasFee')}}</div>
              <template #reference>
                <van-icon name="question hover" @mouseover="showPopover = true" @mouseout="showPopover = false" />
              </template>
            </van-popover>
          </div>
          <div class="value green">{{ gasFee}} {{currentNetwork.currencySymbol}}</div>
        </div>
        <div class="card flex between card-sml pb-10">
          <div class="label">{{t('transactionDetails.totalAmount')}}</div>
          <div class="value">{{ totalAmount }} {{currentNetwork.currencySymbol}}</div>
        </div>
      </div>
    </div>
    <div class="flex pb-24 mt-22 btn-box">
      <van-button block @click="cancel" class="mr-24">{{t('transactionDetails.cancel')}}</van-button>
      <van-button block type="primary" @click="view">{{t('transactionDetails.viewDetails')}}</van-button>
    </div>
  </div>
</template>

<script lang="ts">
import { SetupContext, Ref, ref, reactive, onMounted, defineComponent, computed } from 'vue'
import { Icon, Toast, Button,Popover } from 'vant'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { transactionTarget, formatDate, addressMask, formatEther, transactionStatus, parseEther } from '@/utils/filters'
import { utils } from 'ethers'
import { copy } from '@/utils/utils'
import { useI18n } from 'vue-i18n'
import BigNumber from 'bignumber.js'
import { useToast } from '@/plugins/toast'
import {VUE_APP_SCAN_URL} from '@/enum/env'
export default defineComponent({
  name: 'transactionDetail',
  emits: ['handleClose'],
  components: {
    [Icon.name]: Icon,
    [Button.name]: Button,
    [Popover.name]: Popover
  },
  props: {
    data: {
      type: Object,
      default: {}
    }
  },
  setup(props: any, context: SetupContext) {
    const { t } = useI18n()
    const { emit } = context
    const store = useStore()
    const accountInfo = computed(() => store.state.account.accountInfo)
    const currentNetwork = computed(() => store.state.account.currentNetwork)
    const {$toast} = useToast()
    const handleClose = () => {
      emit('handleClose')
    }
    const toCopy = () => {
      copy(props.data.hash).then(res => {
        Toast.success(t('copy.titlehash'))
      })
    }
    const tolink = () => {
      console.log(currentNetwork.value.browser)
    }
    const showPopover = ref(false)
    // aggregate amount
    const totalAmount = computed(() => {
      const am = gasFee.value.plus(utils.formatEther(props.data.value)).toString()
      return am
    })

    // gas= gasLimit * gasPrice
    const gasFee = computed(() => {
      const price = new BigNumber(utils.formatEther(props.data.effectiveGasPrice)).multipliedBy(1000000000)
      const gasuse = new BigNumber(utils.formatEther(props.data.gasUsed)).multipliedBy(1000000000)
      return gasuse.multipliedBy(price)
    })
    const view = () => {
      window.open(`${VUE_APP_SCAN_URL}TradeDetail/${props.data.hash}`)
    }
    const cancel = () => {
      emit('handleClose')
    }
    return {
      t,
      cancel,
      view,
      handleClose,
      transactionTarget,
      formatDate,
      addressMask,
      accountInfo,
      formatEther,
      parseEther,
      toCopy,
      utils,
      showPopover,
      currentNetwork,
      tolink,
      totalAmount,
      transactionStatus,
      gasFee
    }
  }
})
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
