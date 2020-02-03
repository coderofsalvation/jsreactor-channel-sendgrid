var z = require('zora')
var _ = require('jsreactor/_')
var bre/*BRE engine instance*/
var BRE = require('jsreactor')
process.env.DEBUG = '*'  
// init channels
var plugin
var MyPlugin   = require('./../') // index.js
var Input      = require('jsreactor/channel/Input') 

z.test('init BRE',  async (t) => {
  bre = new BRE()
  new Input({bre})
  plugin = new MyPlugin({bre})
  t.ok(true,"inited")
})

z.test('loadRuleConfigs', async (t) => {
    
  bre.loadRuleConfigs = () => {
     return new Promise( (resolve, reject) => resolve([
      {
        "name": "test",
        "config": {
          "basic": {
            "name": "send email when {email:\"***@***\"}",
            "notes": "foo bar",
            "disabled": false
          },
          "action": [
            {
              "config": {
                "body": "hello {{#if email}}\n\t<h2>{{email}}</h2>\n{{/if}}",
                "type": "send_email",
                "config": {
                  "cc": "",
                  "to": "{{email}}",
                  "bcc": "",
                  "from": "me@gmail.com",
                  "language": "",
                  "template": "d-85ecb95d32da40e5a7a23a4a5a7f5e16",
                  "debugemail": "me@gmail.com"
                },
                "subject": "my subject"
              },
              "channel": "Sendgrid Email"
            }
          ],
          "trigger": [ /* empty always triggers */ ]
        },
        "objectId": "3Kiu8bXNd6"
      }
     ]))
  }
  t.ok(true,"ok")
})

z.test('run input through rules engine', async (t) => {
  // spy function
  var old = plugin.sendEmail 
  plugin.sendEmail = function(input,config,results){
    old.apply(this,arguments)
    console.dir(config)
    plugin.sendEmail.called = true
  }
  await bre.init()
  t.ok(plugin.sendEmail.called,"sendEmail was called")
})

z.test('run multiple inputs through rules engine', async (t) => {
  // spy function
  var old = plugin.sendEmail 
  plugin.sendEmail = function(){
    old.apply(this,arguments)
    plugin.sendEmail.called += 1
  }
  plugin.sendEmail.called = 0

  await bre.init()
  var result = await bre.run({
    '0':{email:"foo@bar.com"},
    '1':{email:"BAR@bar.com"}
  })
  t.ok(plugin.sendEmail.called == 2,"sendEmail was called twice")
})


