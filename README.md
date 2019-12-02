## Install

    $ npm install jsreactor-channel-sendgrid @coderofsalvation/jsreactor 

then include it as usual:

    var BRE = require('jsreactor')

    var b = BRE(/* myBackendAdapter */ )
    var inputChannel     = require('jsreactor/channel/Input)
    var sendgridChannel  = require('jsreactor-channel-sendgrid')
    new inputChannel(b)
    new sendgridChannel(b)
    b.init() // first init
        
    b.run({email:"foo@flop.com"}) // data will be passed thru the business rules engine
                                  // and conditionally triggers actions

> for more see [jsreactor](https://npmjs.com/package/@coderofsalvation/jsreactor) module and see the [test](https://github.com/coderofsalvation/jsreactor-channel-sendgrid/blob/master/test/test.js)

## Environment vars

* SENDGRID_API_KEY=l2k3l2k3 (see [sendgrid](npmjs.com/package/sendgrid))
* SENDGRID_FROM=my@company.com (default from-address)
* SENDGRID_TEMPLATE=lk3l3-lk34 (default template)

## Notes

If you want to send attachements just pass `{email:"foo@flop.com",attachments:[]}` (see [docs](https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/index.html) for attachment-format)