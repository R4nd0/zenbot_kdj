var z = require('zero-fill')
  , n = require('numbro')
  , kdj = require('../../../lib/kdj')
  , sma = require('../../../lib/sma')
  , cci = require('../../../lib/cci')
  , Phenotypes = require('../../../lib/phenotype')

module.exports = {
  name: 'kdj',
  description: 'KDJ strategy for zenbot.',

/*
Licence: MIT 
Trade / use at your own risk!
Reddit: king_fredo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

KDJ gives great signals to change trends at crossover. Depending on the value of J it can be considered bullish or bearish. KDJ excels at determining both the trend and optimal entry points. For this strategy, orders are triggered in a crossover in the bullish or bearish area.
*/

  getOptions: function () {

    console.log('KDJ')

	/* Universal */
    this.option('period', 'period length, same as --period_length', String, '300s')
    this.option('period_length', 'period length, same as --period', String, '300s')
    this.option('min_periods', 'min. history periods', Number, 600)

	/* KDJ indicator options */
    this.option('kdj_periods', 'number of RSI periods', Number, 14)
    this.option('stoch_k', 'smooth %K line', Number, 9)
    this.option('stoch_d', 'smooth %D and %J line', Number, 3)
    this.option('j_bullish', 'must be above this before selling', Number, 80)
    this.option('j_bearish', 'must be below this before buying', Number, 20)

  },

  calculate: function (s) {

	// Calculate KDJ
	kdj(s,'kdj', s.options.kdj_periods, s.options.stoch_k, s.options.stoch_d)
  },

  onPeriod: function (s, cb, c) {
	
    if (!s.in_preroll) {

	    //KDJ SWITCH1
        var divergent = s.period.kdj_K - s.period.kdj_J
        var last_divergent = s.lookback[0].kdj_K - s.lookback[0].kdj_J
        var _switch1 = 0
        var nextdivergent = (( divergent + last_divergent ) /2) + (divergent - last_divergent)
        if ((last_divergent <= 0 && (divergent > 0)) && s.period.kdj_J < s.options.j_bearish) _switch1 = 1 // price rising
        if ((last_divergent >= 0 && (divergent < 0)) && s.period.kdj_J > s.options.j_bullish) _switch1=  -1 // price falling
        s.period._switch1 = _switch1

        // BUY && SELL
        s.signal = null
    
        if (_switch1 == -1)
            {
                s.signal = 'sell'
            }
        else if (_switch1 == 1)
            {
                s.signal = 'buy'
             }
	}
    cb()
  },

  onReport: function (s) {
    var cols = []

	if (typeof s.period.kdj_J !== 'undefined') {

	 color = 'grey'
	 cols.push(' %K: ')
 	 cols.push(z(3, n(s.period.kdj_K).format('0'), ' ')[color])
	 cols.push(' %D: ')
 	 cols.push(z(3, n(s.period.kdj_D).format('0'), ' ')[color])
	 cols.push(' %J: ')
 	 cols.push(z(3, n(s.period.kdj_J).format('0'), ' ')[color])
  	 cols.push(' %J-sw: ')
	 cols.push(z(3, n(s.period._switch1).format('-0'), ' ')[color])

	}
	else {
	cols.push('                                                      ')
	}
    return cols
  },

  phenotypes: {
    // -- common 

	period_length: Phenotypes.ListOption(['60s', '90s', '120s','180s','240s','300s','360s','420s','480s']),
	min_periods: Phenotypes.Range(600, 600),

    // -- strategy
	kdj_periods: Phenotypes.Range(14, 35),
	stoch_k: Phenotypes.Range(5, 12),
	stoch_d: Phenotypes.Range(3, 3),
	j_bullish: Phenotypes.Range(60, 100, 5),
    j_bearish: Phenotypes.Range(0, 40, 5),

  }
}

