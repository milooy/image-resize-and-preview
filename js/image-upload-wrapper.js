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
            check_extension: function($el, ext_arr, error_msg){
                var file_ext = $el.val().toLowerCase().split('.').pop();
                if(ext_arr.map(function(v) {
                        return v.toLowerCase();
                    }).indexOf(file_ext) < 0) {
                    alert(error_msg || 'You can upload file with ' + ext_arr.join(', '));
                    $el.val('');
                }
            },
            /*
             FUNCTION: Image File Resizing In Frontend
             http://stackoverflow.com/questions/10333971/html5-pre-resize-images-before-uploading
             */
            resize: function($el, max_width, max_height) {
                var dataurl = null;
                var filesToUpload = document.getElementById('photo').files;
                var file = filesToUpload[0];

                // Create an image
                var img = document.createElement("img");
                // Create a file reader
                var reader = new FileReader();
                // Set the image once loaded into file reader
                reader.onload = function(e)
                {
                    img.src = e.target.result;

                    img.onload = function () {
                        var canvas = document.createElement("canvas");
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);

                        var MAX_WIDTH = 800;
                        var MAX_HEIGHT = 600;
                        var width = img.width;
                        var height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);

                        dataurl = canvas.toDataURL("image/jpeg");

                        // Post the data
                        var fd = new FormData();
                        fd.append("name", "some_filename.jpg");
                        fd.append("image", dataurl);
                        fd.append("info", "lah_de_dah");
                        $.ajax({
                            url: '/ajax_photo',
                            data: fd,
                            cache: false,
                            contentType: false,
                            processData: false,
                            type: 'POST',
                            success: function(data){
                                $('#form_photo')[0].reset();
                                location.reload();
                            }
                        });
                    } // img.onload
                }
                // Load files into file reader
                reader.readAsDataURL(file);
            },
            /*
             FUNCTION: Preview Image
             http://stackoverflow.com/questions/14069421/show-an-image-preview-before-upload
             */
            preview: function($el, image_holder) {
                var $image_holder = $('#' + image_holder);
                $image_holder.empty();
                var reader = new FileReader();
                reader.onload = function (e) {
                    $("<img />", {
                        "src": e.target.result,
                        "class": "thumb_image"
                    }).appendTo($image_holder);
                };
                reader.readAsDataURL($el[0].files[0]);
            },
            molamola: function() {
                $('#id_photo').on('change', function () { /*-- 파일 확장자 확인 --*/
                    if (typeof (FileReader) != "undefined") {
                        var image_holder = $("#image-holder");
                        image_holder.empty();

                        var img = document.createElement("img");
                        var reader = new FileReader();

                        reader.onload = function (e) {
                            img.src = e.target.result;
                            img.onload = function() {
                                var canvas = document.createElement("canvas");
                                var ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0);

                                var MAX_WIDTH = 500;
                                var MAX_HEIGHT = 500;
                                var width = img.width;
                                var height = img.height;

                                if (width > height) {
                                    if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                    }
                                } else {
                                    if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height;
                                        height = MAX_HEIGHT;
                                    }
                                }
                                canvas.width = width;
                                canvas.height = height;

                                ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0, width, height);

                                ImageManager.dataURItoBlob(canvas.toDataURL("image/jpeg"));
                                ImageManager.init.dataurl = ImageManager.dataURItoBlob(canvas.toDataURL("image/jpeg"));
                            };
                            $("<img />", {
                                "src": e.target.result,
                                "class": "thumb-image"
                            }).appendTo(image_holder);
                        };
                        image_holder.show();
                        reader.readAsDataURL($(this)[0].files[0]);
                    } else {
                        alert("파일 업로드를 지원하지 않는 브라우저입니다. 다른 환경에서 시도해주시면 감사하겠습니다.");
                    }
                });
            }
        };

        return this.each(function(){
            var options = $.extend({}, $.fn.simpleImage.defaults, opts || {});
            var $el = $(this);
            console.log('this: ', $el)

            $($el).on('change', function () { // 이미지파일이 올라오려 함
                Uploader.check_extension($el, options.file_extension, options.file_extension_error_message);
                if (typeof (FileReader) != "undefined") { // 파일리더 지원 여부 확인
                    /*-- 프리뷰 --*/
                    if(options.preview) {
                        Uploader.preview($el, options.preview_container_id);
                    }

                } else {
                    alert("This browser not allow FileReader.");
                }

            });


        });
    };

    // 기본값을 외부에서 변경 가능
    $.fn.simpleImage.defaults = {
        preview: false,
        preview_container_id: "image_holder",
        max_width: 100,
        max_height: 200,
        file_extension: ['png', 'jpeg', 'jpg', 'gif', 'bmp'],
        file_extension_error_message: undefined
    }

})(jQuery);
