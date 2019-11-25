// default conditional operators from json-logic-schema
var _           = require('./_')
var tpl         = require('handlebars')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Sendgrid Email" // this is the channel name
    this.description = "send emails through sendgrid"  
    
    function debugVariables(obj){
        var   o = _.flatten(obj)
        var str = "<br><br><hr><b>template variables</b><br><br><table>"
        for (var i in o ) str += `<tr><td style="min-width:100px;padding:2px 10px;background-color:#F7F7F7">{{${i}}}</td><td>${o[i]}</td></tr>`
        str += "</table>"
        return str
    }

    this.sendEmail = (input,config,results) => {
        console.log("sending email")
        var cfg    = config.config
        var tplvars = {}
        var contentStr = tpl.compile(config.body)(input)
        // create tplvars to replace in body (and pass as substitutions to sendgrid)
        for( var i in input ){
            if( !i.match(/succes-*/) ) tplvars[i] = input[i]
        }
        if( cfg.debugemail == tpl.compile(cfg.to)(input) ) 
            contentStr += debugVariables(tplvars) 
        
        tplvars['content'] = contentStr
        // compose email
        var helper = require('sendgrid').mail;
        var fromEmail = new helper.Email( tpl.compile(cfg.from)(input) );
        var toEmail = new helper.Email( tpl.compile(cfg.to)(input) );
        var content = new helper.Content('text/html', contentStr )
        var mail = new helper.Mail(fromEmail, config.subject, toEmail, content).toJSON()
        mail.template_id = tpl.compile(cfg.template)(input)
        mail.personalizations[0].subject = tpl.compile(config.subject)(input)
        if( cfg.cc )    mail.personalizations[0].cc  = tpl.compile(cfg.cc)(input)
        if( cfg.bcc)    mail.personalizations[0].bcc = tpl.compile(cfg.bcc)(input)
        mail.personalizations[0].dynamic_template_data = tplvars
        //debug(JSON.stringify(mail,null,2))
        
        var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail
        });
        
        sg.API(request, function (error, response) {
            if (error || !String(response.statusCode).match(/20/) ) {
                console.error(`sendgrid response: (${input.runid}) ${error} ${JSON.stringify(response.body,null,2)}\n${JSON.stringify(mail,null,2)}`)
            }else bre.log(`sendgrid response OK (${input.runid})`)
        });
        return {input,config,results}
    }

    this.init = async () => {
        opts.bre.log("registering "+this.title)
        this.trigger = {
            schema: [
                /*
                {
                    type:"object",
                    title:"when email arrives",
                    description:"not implemented (yet)",
                    properties:{
                        type: bre.addType('when_email_arrives', async (input,cfg) => false ),
                    }
                } 
                */   
            ]
        }
        
        this.action  = {
            schema: [
                {
                    type:"object",
                    title:"send email",
                    properties:{
                        type: bre.addType('send_email', this.sendEmail ),
                        subject:{ type:"string",title:"subject",default:"my subject",options:{inputAttributes:{placeholder:"subject"}}},
                        body:{
                            type:"string",
                            format:"xhtml",
                            title:"body",
                            description:"mustache template language supported (for all fields). This textarea is exposed as {{content}} in sendgrid.",
                            default:"hello {{foo}} {{a.b}}\n\n{{#if bar}}\n\t<h2>jaaaa</h2>\n{{/if}}"                      
                        },
                        config:{
                            type:"object",
                            title:"more options",
                            options:{disable_collapse:false,collapsed:true},
                            properties:{
                                language:{type:"string",maxLength:2,title:"language",options:{inputAttributes:{placeholder:"EN"}}},
                                from:{ type:"string",title:"from",default: process.env.SENDGRID_FROM || "me@foo.com"},
                                to:{ type:"string",title:"to",default:"{{email}}"},
                                cc:{ type:"string",title:"cc",options:{inputAttributes:{placeholder:"cc (commaseparated)"}}},
                                bcc:{ type:"string",title:"bcc",options:{inputAttributes:{placeholder:"bcc (commaseparated)"}}},        
                                template:{ type:"string",title:"template ID (sendgrid)",default:process.env.SENDGRID_TEMPLATE||"",options:{inputAttributes:{placeholder:"enter sendgrid template ID here"}}},
                                debugemail:{type:"string",title:"debug email",options:{inputAttributes:{placeholder:"me@company.com"}},description:"this email-receiver can see all template variables in bottom of email"}
                            }
                        }
                        
                    }
                }            
            ]            
        }

    }

    opts.bre.addChannel(this)
  
    return this
}
