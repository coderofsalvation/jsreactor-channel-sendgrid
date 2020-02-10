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

    this.compile = (obj,data) => {
        for( var i in obj ) obj[i] = typeof obj[i] != "string" ? obj[i] : tpl.compile(obj[i])(data)
    }

    this.sendEmails = (input,config,results) => {
        var multiple = false
        for( var i = 0; input.output[i]; i++ ){
            this.sendEmail( input.output[i], _.clone(config), results )
            multiple = true
        }
        if( !multiple ) this.sendEmail(input,config,results)
    }

    this.sendEmail = (input,config,results) => {
        var cfg    = config.config
        if( (cfg.language || input.language) && input.language != cfg.language ) return // not our language..skip 
        var tplvars = {}
        // evaluate handlebar templates
        this.compile(config,input)
        this.compile(cfg,input)
        var contentStr = config.body
        // create tplvars to replace in body (and pass as substitutions to sendgrid)
        for( var i in input ){
            // ignore requestdata or succes-messages from jsreactor
            if( !i.match(/(succes-*|^req$|^request$)/) ) tplvars[i] = input[i]
        }
        if( cfg.debug ) 
            contentStr += debugVariables(tplvars) 
        
        tplvars.content = contentStr
        tplvars.subject = config.subject
        // compose email
        var helper = require('sendgrid').mail;
        var fromEmail = new helper.Email( cfg.from );
        var toEmail = new helper.Email( cfg.to );
        var content = new helper.Content('text/html', contentStr )
        var mail = new helper.Mail(fromEmail, config.subject, toEmail, content).toJSON()
        mail.subject = config.subject
        mail.template_id = cfg.template
        if( input.attachments ) mail.attachments = input.attachments
        mail.personalizations[0].subject = config.subject
        if( cfg.cc )    mail.personalizations[0].cc  = cfg.cc.split(",").map( (e) => ({email:e.trim()}) )
        if( cfg.bcc)    mail.personalizations[0].bcc = cfg.bcc.split(",").map( (e) => ({email:e.trim()}) )
        mail.personalizations[0].dynamic_template_data = tplvars
        //mail.personalizations[0].substitutions = {subject:config.subject}
        //console.log(JSON.stringify(mail,null,2))
        
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
                        type: bre.addType('send_email', this.sendEmails ),
                        subject:{ type:"string",title:"subject",default:"my subject",options:{inputAttributes:{placeholder:"subject"}}},
                        body:{
                            type:"string",
                            format:"xhtml",
                            title:"body",
                            description:"<a href='https://gist.github.com/LeCoupa/6176077a9a8e2ad00eda' target='_blank'>handlebars</a> template language supported (for all fields).<br>This textarea is exposed as {{content}} in sendgrid.<br>For attachments pass <a href='https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/index.html' target='_blank'>.attachments</a>-array to the input.",
                            default:"hello {{foo}} {{a.b}}\n\n{{#if bar}}\n\t<h2>jaaaa</h2>\n{{/if}}"                      
                        },
                        config:{
                            type:"object",
                            title:"more options",
                            options:{disable_collapse:false,collapsed:true},
                            properties:{
                                language:{type:"string",maxLength:2,title:"language",options:{inputAttributes:{placeholder:"EN"}},description:"entering 'NL' will only send this email if {language:'NL'} was passed as input"},
                                from:{ type:"string",title:"from",default: process.env.SENDGRID_FROM || "me@foo.com"},
                                to:{ type:"string",title:"to",description:"array is also supported",default:"{{email}}"},
                                cc:{ type:"string",title:"cc",options:{inputAttributes:{placeholder:"cc (commaseparated)"}}},
                                bcc:{ type:"string",title:"bcc",options:{inputAttributes:{placeholder:"bcc (commaseparated)"}}},        
                                template:{ type:"string",title:"template ID (sendgrid)",default:process.env.SENDGRID_TEMPLATE||"",options:{inputAttributes:{placeholder:"enter sendgrid template ID here"}}},
                                debug:{type:"boolean",format:"checkbox",title:"debug mode",options:{inputAttributes:{placeholder:"me@company.com"}},description:"bcc & cc-receivers can see all template variables in bottom of email"}
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
