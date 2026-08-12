(function() {
    'use strict';

    const CONFIG = {
        TARGET_KEY: 'file_upload.php',

        // photo.0305.tw.cn API
        NEW_API: 'https://photo.0305.tw.cn/api/index.php',

        // 你的token
        TOKEN: '你的token',

        // 原iirose前缀
        ORIGINAL_PREFIX: 'http://r.iirose.com/'
    };


    let usePhoto = localStorage.getItem('upload_mode_photo') === 'true';


    // UI
    const style = document.createElement('style');

    style.innerHTML = `
    #custom-ui-capsule {
        position: fixed;
        right:0;
        bottom:5%;
        z-index:99999;
        width:95px;
        height:38px;
        background:rgba(0,0,0,.15);
        border-radius:100px 0 0 100px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        color:white;
        user-select:none;
        transform:translateX(75px);
        transition:.4s;
        backdrop-filter:blur(2px);
    }

    #custom-ui-capsule:hover {
        transform:translateX(0);
        background:rgba(0,0,0,.5);
    }

    .mode-text {
        font-size:12px;
        opacity:.3;
    }

    #custom-ui-capsule:hover .mode-text {
        opacity:1;
    }
    `;

    document.head.appendChild(style);


    const capsule=document.createElement('div');

    capsule.id='custom-ui-capsule';

    capsule.innerHTML=
        `<div class="mode-text">
        ${usePhoto?'photo':'iirose'}
        </div>`;

    document.body.appendChild(capsule);



    capsule.onclick=function(e){

        e.stopPropagation();

        usePhoto=!usePhoto;

        localStorage.setItem(
            'upload_mode_photo',
            usePhoto
        );


        capsule.querySelector('.mode-text')
        .innerText=
        usePhoto?'photo':'iirose';


        updatePrefix();

    };



    function updatePrefix(){

        const target=
        window.Constant ||
        (typeof Constant!=='undefined'?Constant:null);


        if(target && target.URL){

            target.URL.uploadedPrefixImg =
            usePhoto
            ?
            ''
            :
            CONFIG.ORIGINAL_PREFIX;

        }

    }


    setInterval(updatePrefix,2000);

    updatePrefix();



    // 拦截上传请求

    const oldOpen=
    XMLHttpRequest.prototype.open;


    XMLHttpRequest.prototype.open=
    function(method,url){

        if(
            typeof url==='string'
            &&
            url.includes(CONFIG.TARGET_KEY)
        ){

            this._isUpload=true;

        }


        return oldOpen.apply(this,arguments);

    };




    const oldSend=
    XMLHttpRequest.prototype.send;


    XMLHttpRequest.prototype.send=
    function(data){


        const xhr=this;



        if(
            usePhoto
            &&
            this._isUpload
            &&
            data instanceof FormData
        ){


            const file=
            data.get('file')
            ||
            [...data.values()]
            .find(v=>v instanceof File);



            if(!file){

                return oldSend.apply(this,arguments);

            }



            const fd=
            new FormData();


            fd.append(
                'image',
                file
            );


            fd.append(
                'token',
                CONFIG.TOKEN
            );



            fetch(
                CONFIG.NEW_API,
                {
                    method:'POST',
                    body:fd,
                    mode:'cors'
                }
            )


            .then(res=>res.json())


            .then(json=>{


                console.log(
                    '[photo图床]',
                    json
                );


                if(
                    json.code===200
                    &&
                    json.url
                ){


                    let url=json.url;


                    if(!url.includes('#e')){
                        url+='#e';
                    }



                    Object.defineProperties(
                        xhr,
                        {

                            readyState:{
                                value:4,
                                configurable:true
                            },


                            status:{
                                value:200,
                                configurable:true
                            },


                            responseText:{
                                value:url,
                                configurable:true
                            },


                            response:{
                                value:url,
                                configurable:true
                            }

                        }
                    );



                    xhr.dispatchEvent(
                        new Event('readystatechange')
                    );


                    xhr.dispatchEvent(
                        new Event('load')
                    );


                    xhr.dispatchEvent(
                        new Event('loadend')
                    );


                }



            })


            .catch(err=>{

                console.error(
                    '[photo上传失败]',
                    err
                );

            });



            return;

        }




        // 原iirose上传保持不变

        if(
            !usePhoto
            &&
            this._isUpload
        ){


            const old=
            xhr.onreadystatechange;



            xhr.onreadystatechange=function(){


                if(
                    xhr.readyState===4
                    &&
                    xhr.status===200
                ){


                    let text=
                    xhr.responseText;


                    if(
                        text
                        &&
                        !text.includes('#e')
                    ){


                        let n=
                        text+'#e';



                        Object.defineProperties(
                            xhr,
                            {

                                responseText:{
                                    value:n,
                                    configurable:true
                                },

                                response:{
                                    value:n,
                                    configurable:true
                                }

                            }
                        );


                    }


                }



                if(old){

                    old.apply(
                        this,
                        arguments
                    );

                }


            };


        }



        return oldSend.apply(this,arguments);


    };

})();
