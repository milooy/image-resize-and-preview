var foo;
(function($){
    $.fn.simpleImage = function(opts){
        console.log("이미지 업로더 시작!", opts);

        /*-- 필요한 함수 모음 --*/
        var Uploader = {
            _dataURItoFile: function(dataURI, filename) {
                /*
                 FUNCTION: change data uri -> blob -> file (after image resizing)
                 - http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
                 - http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
                 */
                //var byteString;
                //if (dataURI.split(',')[0].indexOf('base64') >= 0)
                //    byteString = atob(dataURI.split(',')[1]);
                //else
                //    byteString = decodeURI(dataURI.split(',')[1]);
                //
                //var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                //
                //var ia = new Uint8Array(byteString.length);
                //for (var i = 0; i < byteString.length; i++) {
                //    ia[i] = byteString.charCodeAt(i);
                //}
                //return new Blob([ia], {type:mimeString});

                var blobBin = atob(dataURI.split(',')[1]);
                var array = [];
                for(var i = 0; i < blobBin.length; i++) {
                    array.push(blobBin.charCodeAt(i));
                }
                return new File([new Blob([new Uint8Array(array)], {type: 'image/png'})], filename+'.png');
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
                    var width = img.width; // 원래 이미지 정보
                    var height = img.height;

                    if(max_width || max_height) { // 리사이즈
                        var canvas = document.createElement("canvas");
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

                        var dataurl = canvas.toDataURL("image/png", 0.5);
                        $.fn.simpleImage.resizedImage = Uploader._dataURItoFile(dataurl, file.name);
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
                reader.readAsDataURL(file);
            }
        };

        return this.each(function(){
            var options = $.extend({}, $.fn.simpleImage.defaults, opts || {});
            var $el = $(this);

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
