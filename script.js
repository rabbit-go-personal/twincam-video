//'use strict';    //使わなくてもいいや 書き方を厳しくチェックするもの。あるとバグが起きにくくなりやすい。らしい

let localStream = null;
let peer = null;
let existingCall = null;
let isReceive = false;    //受信専用かどうか
let VIDEO_CODEC = 'VP9';

let mediaRecorder = null;
let rcvStream = null;

let videoTrack;
let capabilities;
let constraints;
let settings;

//カメラ映像、マイク音声の取得
function getmedia(wid, hei, fra) {    //引数は(幅,高さ,fps)
    //セットされている自分のビデオを削除
    $('#my-video').get(0).srcObject = undefined;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false }, video: true })
        .then(function (stream) {
            // Success
            videoTrack = stream.getVideoTracks()[0];           //MediaStreamから[0]番目のVideoのMediaStreamTrackを取得
            capabilities = videoTrack.getCapabilities();       //設定可能な値の範囲
            videoTrack.applyConstraints({ width: { ideal: wid }, height: { ideal: hei }, frameRate: { ideal: fra } })
                .then(() => {                                  //値を設定
                    constraints = videoTrack.getConstraints(); //設定した値
                    settings = videoTrack.getSettings();       //設定された値
                    $('#width').val(settings.width);                  //今の解像度をresolutionのformに表示
                    $('#height').val(settings.height);
                    $('#framerate').val(settings.frameRate);
                    stream.addTrack(videoTrack);               //設定した動画を追加
                }).catch((err) => {
                    console.error('applyConstraints() error:', err);
                    $('#console').text('applyConstraints() error:' + err);
                });
            $('#my-video').get(0).srcObject = stream;          //設定した動画を画面にセット
            localStream = stream;                              //送信用にキープ
        }).catch(function (error) {
            // Error
            console.error('mediaDevice.getUserMedia() error:', error);
            $('#console').text('mediaDevice.getUserMedia() error:' + error);
            return;
        });
}

//指定した解像度の映像を取得
$('#4K30fps').click(function () {
    getmedia(3840, 1920, 30);
});

$('#4K15fps').click(function () {
    getmedia(3840, 1920, 15);
});


$('#FullHD').click(function () {
    getmedia(1920, 960, 30);
});

$('#960').click(function () {
    getmedia(960, 480, 15);
});

$('#480').click(function () {
    getmedia(480, 240, 10);
});

$('#240').click(function () {
    getmedia(240, 120, 5);
});

$('#Resolution').submit(function (e) {
    e.preventDefault();
    getmedia($('#width').val(), $('#height').val(), $('#framerate').val());
});

//peeridを取得
function getpeerid(id) {
    //ボタンをすべて消す　PeerIDがサーバーに残ってしまい初期化ができない
    $('#peerid-ui').hide();

    //peerオブジェクトの作成
    peer = new Peer(id,{
        key: '9373b614-604f-4fd5-b96a-919b20a7c24e',    //APIkey
        debug: 3
    });

    start();//イベント確認
}

//送受信の設定
function setCallOption(recieve, videoCodec) {
    isReceive = recieve;
    $('#isrcv').text(isReceive);
    VIDEO_CODEC = videoCodec;
    $('#videocod').text(VIDEO_CODEC);
}

//peeridの選択
$('#twincam1').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc1");
    $('#callto-id').val("user1");
});

$('#twincam2').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc2");
    $('#callto-id').val("user2");
});

$('#twincam3').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc3");
    $('#callto-id').val("user3");
});

$('#twincam4').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc4");
    $('#callto-id').val("user4");
});

$('#twincam5').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc5");
    $('#callto-id').val("user5");
});

$('#twincam6').click(function () {
    setCallOption(false, 'VP9');
    getpeerid("tc6");
    $('#callto-id').val("user6");
});

$('#user1').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user1");
    $('#callto-id').val("tc1");
});

$('#user2').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user2");
    $('#callto-id').val("tc2");
});

$('#user3').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user3");
    $('#callto-id').val("tc3");
});

$('#user4').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user4");
    $('#callto-id').val("tc4");
});

$('#user5').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user5");
    $('#callto-id').val("tc5");
});

$('#user6').click(function () {
    setCallOption(true, 'VP9');
    getpeerid("user6");
    $('#callto-id').val("tc6");
});

$('#videot').click(function () {
    setCallOption(false, 'H264');
    getpeerid("videoT");
    $('#callto-id').val("videoU");

});

$('#videou').click(function () {
    setCallOption(false, 'H264');
    getpeerid("videoU");
    $('#callto-id').val("videoT");
});

$('#recieve').click(function () {
    setCallOption(true, 'VP9');
    getpeerid();
    $('#callto-id').val("tc");
});

$('#random').click(function () {
    setCallOption(true, 'VP9');
    getpeerid();
});

//Recordボタン
$('#recstart').click(function () {
    if (rcvStream != null) {
        mediaRecorder = new MediaRecorder(rcvStream);//録画用のインスタンス作成
        mediaRecorder.start();                       //録画開始
        $('#console').text("recorder started");
    }
});

$('#recstop').click(function () {
    if (mediaRecorder != null) {
        mediaRecorder.stop();                        //録画停止
        $('#console').text("recorder stopped");
    }
    mediaRecorder.ondataavailable = function (e) {
        //保存用URLの生成
        let videoBrob = new Blob([e.data], { type: e.data.type });
        let anchor = $('#downloadlink').get(0);
        anchor.text = 'Download';
        anchor.download = 'recorded.webm';
        anchor.href = window.URL.createObjectURL(videoBrob);
    }
});

//reloadボタン
$('#reload').click(function () {
    location.reload(true);
});

//発信処理
$('#make-call').submit(function (e) {
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream, {
        videoCodec: VIDEO_CODEC,
        videoReceiveEnabled: isReceive,
        audioReceiveEnabled: isReceive,
    });
    setupCallEventHandlers(call);
});

//切断処理
$('#end-call').click(function () {
    existingCall.close();
});

//イベント id取得後じゃないと動作しない
function start() {
    //openイベント
    peer.on('open', function () {
        $('#my-id').text(peer.id);
    });

    //errorイベント
    peer.on('error', function (err) {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    peer.on('close', function () {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    peer.on('disconnected', function () {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //着信処理
    peer.on('call', function (call) {
        call.answer(localStream, { videoCodec: VIDEO_CODEC });
        setupCallEventHandlers(call);
    });
}

//Callオブジェクトに必要なイベント
function setupCallEventHandlers(call) {
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    setupEndCallUI(call);

    call.on('stream', function (stream) {
        addVideo(call, stream);
    });

    call.on('close', function () {    //??なぜか実行された側で発火せず??
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}

//video要素の再生
function addVideo(call, stream) {
    rcvStream = stream;                         //録画用にキープ
    $('#their-video').get(0).srcObject = stream;
}

//video要素の削除
function removeVideo(peerId) {
    $('#their-video').get(0).srcObject = undefined;
}

//ボタンの表示
function setupMakeCallUI() {
    $('#make-call').show();
    $('#end-call-ui').hide();
}

//ボタン非表示切り替え
function setupEndCallUI(call) {
    $('#make-call').hide();
    $('#end-call-ui').show();
    $('#their-id').text(call.remoteId);
    $('#console').text('');
}