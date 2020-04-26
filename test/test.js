var z = require('zora')
var _ = require('jsreactor/_')
var bre/*BRE engine instance*/
var BRE = require('jsreactor')
process.env.DEBUG = '*'  
// init channels
var plugin
var MyPlugin   = require('./../') // index.js
var Input      = require('jsreactor/channel/Input') 
var Javascript = require('jsreactor/channel/Javascript') 

z.test('init BRE',  async (t) => {
  bre = new BRE()
  new Input({bre})
  new Javascript({bre})
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
    plugin.sendEmail.called += 1
  }
  plugin.sendEmail.called = 0
  await bre.init()
  t.ok(plugin.sendEmail.called !== undefined,"sendEmail was called")
})

z.test('pass along multiple inputs through previous action', async (t) => {
  
  plugin.sendEmail.called = 0

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
                "type": "javascript",
                "config": {
                    "js": "for( var i = 0; i < 2; i++ ) input[i] = {email:`${i}@foo.com`,output:input.output};"
                }
              },
              "channel": "Javascript"
            },
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
            },
			{
              "config": {
                "type": "javascript",
                "config": {
                    "js": "console.log( JSON.stringify(input) );input.output.continued = true;"
                }
              },
              "channel": "Javascript"
            },
          ],
          "trigger": [ /* empty always triggers */ ]
        },
        "objectId": "3Kiu8bXNd6"
      }
     ]))
  }

  
  await bre.init()
  var result = await bre.run({})
  t.equal(plugin.sendEmail.called, 2 ,"sendEmail was called twice")
  console.dir(result)
  t.ok(result.output.continued, "sendgrid action is not blocking other actions")
})
