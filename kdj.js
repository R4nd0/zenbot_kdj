var mathjs = require('mathjs')
var rsi = require('./rsi')

module.exports = function kdj(s, key, rsi_periods, k_periods, d_periods) {
  let samplesRequiredForStochRSI = rsi_periods + k_periods + 1

  if (s.lookback.length >= samplesRequiredForStochRSI - 1) {
    let RSI = []

    if (typeof s.period.rsi !== 'undefined') {
      RSI.push(s.period.rsi)
    } else {
      rsi(s, 'rsi', rsi_periods)
      RSI.push(s.period.rsi)
    }

    s.lookback.slice(0, samplesRequiredForStochRSI - 1).forEach(function (period) {
      if (period.rsi) {
        RSI.push(period.rsi)
      }
    })

    RSI.reverse()

    if(RSI.length >= samplesRequiredForStochRSI) {
      let stochRSI = []
      for(let i = 0; i < (k_periods + d_periods - 1); i++) {
        let rsiForPeriod = RSI.slice(i, rsi_periods + i)
        let highestRSI = Math.max(...rsiForPeriod)
        let lowestRSI = Math.min(...rsiForPeriod)
        if(highestRSI == lowestRSI) {
          stochRSI.push(0)
        } else {
          stochRSI.push(((RSI[(rsi_periods - 1) + i] - lowestRSI) / (highestRSI - lowestRSI)) * 100)
        }
      }

      stochRSI.reverse()
      let kData
      let percentK = []
      for(let i = 0; i < k_periods; i++) {
        kData = stochRSI.slice(i, k_periods + i)
        if(kData.length == k_periods) {
          percentK.push(mathjs.mean(kData))
        }
      }
      let dData
      let percentD = []
      for(let i = 0; i < d_periods; i++) {
        dData = percentK.slice(i, d_periods + i)
        if(dData.length == d_periods) {
          percentD.push(mathjs.mean(dData))
        }
      }
      let jData
      let percentJ = []
      for(let i = 0; i < k_periods; i++) {
        jData = 3 * percentK[0] - 2 * percentD[0]
        percentJ.push(mathjs.mean(jData))
      }

      s.period[key + '_K'] = percentK[0] == 0 ? 0 : mathjs.round(percentK[0], 2)
      s.period[key + '_D'] = percentD[0] == 0 ? 0 : mathjs.round(percentD[0], 2)
      s.period[key + '_J'] = percentJ[0] == 0 ? 0 : mathjs.round(percentJ[0], 2)

    }
  }
}

