var foo;
(function($){
    $.fn.simpleImage = function(opts){
        console.log("이미지 업로더 시작!", opts);

        /*-- 필요한 함수 모음 --*/
        var Uploader = {
            override_toDataURL: function() {
                var tdu = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = function(type)
                {
                    alert("프로토타입 들어옴");
                    var res = tdu.apply(this,arguments);

                    if(res.substr(0,6) == "data:,")
                    {
                        // TODO: iOS나 안드로이드 구 버전에서 toDataURL이 에러나는거 방지
                        alert("데이터가 안들어가면 인코더를 돌려야 함");
                        alert(new JPEGEncoder());
                        var encoder = new JPEGEncoder();
                        alert(encoder.encode(this.getContext("2d").getImageData(0,0,this.width,this.height), 90, true));
                        return encoder.encode(this.getContext("2d").getImageData(0,0,this.width,this.height), 90, true);
                    }
                    else return res;
                };
            },
            _dataURItoFile: function(dataURI, filename) {
                /*
                 FUNCTION: change data uri -> blob -> file (after image resizing)
                 - http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
                 - http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
                 */
                // TODO: 컴에선 되고 아이오에스에선 안됨
                //alert('들어가지긴 하니?'+dataURI);
                //var blobBin = atob(dataURI.split(',')[1]);
                //var array = [];
                //for(var i = 0; i < blobBin.length; i++) {
                //    array.push(blobBin.charCodeAt(i));
                //}
                //alert('리턴은 되니?'+new File([new Blob([new Uint8Array(array)], {type: 'image/png'})], filename+'.png'));
                //return new File([new Blob([new Uint8Array(array)], {type: 'image/png'})], filename+'.png');



                // TODO: 컴 아이오에스 다 되는데 File로 변환이 안됨
                var byteString;
                if (dataURI.split(',')[0].indexOf('base64') >= 0)
                    byteString = atob(dataURI.split(',')[1]);
                else
                    byteString = decodeURI(dataURI.split(',')[1]);

                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                var ia = new Uint8Array(byteString.length);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                var blob = new Blob([ia], {type:'image/jpeg'});
                alert("블롭:"+ blob instanceof Blob);
                //return new Blob([ia], {type:'image/jpeg'});
                return  new Blob([ia], {type:mimeString});
            },
            /*
             FUNCTION: Check extension after upload file
             */
            check_extension: function($el, ext_arr, error_msg, image_holder){
                var file_ext = $el.val().toLowerCase().split('.').pop();
                if(ext_arr.map(function(v) {
                        return v.toLowerCase();
                    }).indexOf(file_ext) < 0) {

                    alert(error_msg || 'You can upload file with ' + ext_arr.join(', '));
                    $el.val('');
                    if(image_holder) {
                        $('#' + image_holder).empty();
                    }
                }
            },
            /*
             FUNCTION: Preview and Resize Image
             - http://stackoverflow.com/questions/14069421/show-an-image-preview-before-upload
             - http://stackoverflow.com/questions/10333971/html5-pre-resize-images-before-uploading
             */
            resize_preview: function($el, max_width, max_height, preview, image_holder) {

                var img = document.createElement("img"); // 원래 이미지를 담을 돔
                var file = $el[0].files[0];
                var reader = new FileReader();

                reader.onload = function(e) {
                    img.src = e.target.result;
                    img.onload = function() {

                        var width = img.width; // 원래 이미지 정보
                        var height = img.height;
                        alert('위드쓰는 되냐'+width+height);

                        if(max_width || max_height) { // 리사이즈

                            //var canvas = document.createElement("canvas");
                            var canvas = $('<canvas/>', {height: 1000, width: 1000})[0];
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0); //캔버스 맨 위에 원래 이미지 그림

                            if (width > height) {
                                if (width > max_width) {
                                    height *= max_width / width;
                                    width = max_width;
                                }
                            } else {
                                if (height > max_height) {
                                    width *= max_height / height;
                                    height = max_height;
                                }
                            }

                            canvas.width = width; // 캔버스를 리사이즈 함
                            canvas.height = height;
                            var new_ctx = canvas.getContext("2d");

                            new_ctx.drawImage(img, 0, 0, width, height); // 새로운 width, height로 다시 그림
                            var dataurl = canvas.toDataURL("image/jpeg");

                            alert("데이터 유아렐"+ dataurl);
                            $.fn.simpleImage.resizedImage = Uploader._dataURItoFile(dataurl, file.name);
                            alert('여기가 되어야함' + $.fn.simpleImage.resizedImage instanceof Blob);
                        }
                        if(preview) { // 프리뷰
                            var $image_holder = $('#' + image_holder);
                            $image_holder.empty();
                            $("<img />", {
                                "src": dataurl? dataurl : reader.result,
                                "class": "thumb_image"
                            }).appendTo($image_holder);
                        }
                    }
                }
                reader.readAsDataURL(file);
            }
        };

        return this.each(function(){
            var options = $.extend({}, $.fn.simpleImage.defaults, opts || {});
            var $el = $(this);

            Uploader.override_toDataURL();

            if(options.accept_only_image) {
                $el.attr('accept', "image/*");
            }

            $($el).on('change', function () { // 이미지파일이 올라오려 함
                if(Uploader.check_extension){
                    Uploader.check_extension($el, options.file_extension, options.file_extension_error_message, options.preview_container_id);
                }

                if(options.preview || options.max_width || options.max_height) {
                    if (typeof (FileReader) != "undefined") { // 파일리더 지원 여부 확인
                        Uploader.resize_preview($el, options.max_width, options.max_height, options.preview, options.preview_container_id);
                    } else {
                        alert(options.file_upload_error_message);
                    }
                }
            });
        });
    };

    /*
     VARIABLE: Resized Image file (Use in form data / ajax)
     */
    $.fn.simpleImage.resizedImage =  undefined;

    /*
     OPTION: You avalable to change default outside the plugin
     */
    $.fn.simpleImage.defaults = {
        accept_only_image: false, /* true or false */
        preview: false, /* true or false */
        preview_container_id: "image_holder",
        max_width: undefined, /* px */
        max_height: undefined, /* px */
        file_extension: ['png', 'jpeg', 'jpg', 'gif', 'bmp'], /* If you don't want to use it, check it 'false' */
        file_extension_error_message: undefined,
        file_upload_error_message: "This browser doesn't support FileReader. Use another browser."
    }
})(jQuery);
