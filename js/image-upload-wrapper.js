var foo;
(function($){
    $.fn.simpleImage = function(opts){
        console.log("이미지 업로더 시작!", opts);

        /*-- 필요한 함수 모음 --*/
        var Uploader = {
            _dataURItoBlob: function(dataURI) {
                /*
                 이미지 리사이즈 후 생긴 data uri를 파일로 변환
                 http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
                 */
                var byteString;
                if (dataURI.split(',')[0].indexOf('base64') >= 0)
                    byteString = atob(dataURI.split(',')[1]);
                else
                    byteString = unescape(dataURI.split(',')[1]);

                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                var ia = new Uint8Array(byteString.length);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                return new Blob([ia], {type:mimeString});
            },
            /*
             FUNCTION: Check extension after upload file
             */
            check_extension: function($el, ext_arr, error_msg){
                var file_ext = $el.val().toLowerCase().split('.').pop();
                if(ext_arr.map(function(v) {
                        return v.toLowerCase();
                    }).indexOf(file_ext) < 0) {
                    alert(error_msg || 'You can upload file with ' + ext_arr.join(', '));
                    $el.val('');
                }
            },
            preview: function($el, image_holder) {
                var $image_holder = $('#' + image_holder);
                $image_holder.empty();
                var reader = new FileReader();
                reader.onload = function (e) {
                    $("<img />", {
                        "src": reader.result,
                        "class": "thumb_image"
                    }).appendTo($image_holder);
                };
                reader.readAsDataURL($el[0].files[0]);
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

                        var dataurl = canvas.toDataURL("image/png");

                        //console.log('value:', $el.value, $el.val(), $el[0].value, $el[0].val)
                        //$el[0].value = Uploader._dataURItoBlob(canvas.toDataURL("image/jpeg"));
                        //console.log('value:', $el[0].value)
                        //console.log("힝", $el.closest('form').serializeArray());
                        $.fn.simpleImage.resizedImage = Uploader._dataURItoBlob(canvas.toDataURL("image/jpeg"));
                        console.log("리사이즈:", $.fn.simpleImage.resizedImage);
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
                console.log("힝2", $el.closest('form').serialize());
            }
        };

        return this.each(function(){
            var options = $.extend({}, $.fn.simpleImage.defaults, opts || {});
            var $el = $(this);
            $($el).on('change', function () { // 이미지파일이 올라오려 함
                if(Uploader.check_extension){
                    Uploader.check_extension($el, options.file_extension, options.file_extension_error_message);
                }

                if(options.preview || options.max_width || options.max_height) {
                    if (typeof (FileReader) != "undefined") { // 파일리더 지원 여부 확인
                        Uploader.resize_preview($el, options.max_width, options.max_height, options.preview, options.preview_container_id);
                        console.log("힝3", $el.closest('form').serialize());
                    } else {
                        alert("This browser not doesn't FileReader.");
                    }
                }
            });
        });
    };

    $.fn.simpleImage.resizedImage =  undefined;

    // 기본값을 외부에서 변경 가능
    $.fn.simpleImage.defaults = {
        preview: false,
        preview_container_id: "image_holder",
        max_width: undefined, // px
        max_height: undefined, // px
        file_extension: ['png', 'jpeg', 'jpg', 'gif', 'bmp'], // if you don't want to use it, check it 'false'
        file_extension_error_message: undefined
    }
})(jQuery);
