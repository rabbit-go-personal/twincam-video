//'use strict';    //使わなくてもいいや 書き方を厳しくチェックするもの。あるとバグが起きにくくなりやすい。らしい

let localStream = null;
let peer = null;
let existingCall = null;
let isReceive = false;    //受信専用かどうか
const VIDEO_CODEC = 'VP9';

let videoTrack;
let capabilities;
let constraints;
let settings;

//カメラ映像、マイク音声の取得
function getmedia(video_option) {
    //セットされている自分のビデオを削除
    $('#my-video').get(0).srcObject = undefined;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false }, video: true })
        .then(function (stream) {
            // Success
            videoTrack = stream.getVideoTracks()[0];           //MediaStreamから[0]番目のVideoのMediaStreamTrackを取得
            capabilities = videoTrack.getCapabilities();       //設定可能な値の範囲
            videoTrack.applyConstraints(video_option)
                .then(() => {                                  //値を設定
                    constraints = videoTrack.getConstraints(); //設定した値
                    settings = videoTrack.getSettings();       //設定された値
                    stream.addTrack(videoTrack);               //設定した動画を追加
                }).catch((err) => {
                    console.error('applyConstraints() error:', err);
                });
            $('#my-video').get(0).srcObject = stream;          //設定した動画を画面にセット
            localStream = stream;                              //送信用にキープ
        }).catch(function (error) {
            // Error
            console.error('mediaDevice.getUserMedia() error:', error);
            return;
        });
}

//指定した解像度の映像を取得
$('#4K').click(function () {
    getmedia({ width: { ideal: 3840 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } });
});

$('#FullHD').click(function () {
    getmedia({ width: { ideal: 1920 }, height: { ideal: 960 }, frameRate: { ideal: 30 } });
});

$('#960').click(function () {
    getmedia({ width: { ideal: 960 }, height: { ideal: 480 }, frameRate: { ideal: 15 } });
});

$('#480').click(function () {
    getmedia({ width: { ideal: 480 }, height: { ideal: 240 }, frameRate: { ideal: 10 } });
});

$('#240').click(function () {
    getmedia({ width: { ideal: 240 }, height: { ideal: 120 }, frameRate: { ideal: 5 } });
});

$('#Resolution').submit(function (e) {
    e.preventDefault();
    getmedia({ width: { ideal: $('#width').val() }, height: { ideal: $('#height').val() }, frameRate: { ideal: $('#framerate').val() } });
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

//peeridの選択
$('#twincam1').click(function () {
    getpeerid("tc1");
    $('#callto-id').val("user1");
});

$('#twincam2').click(function () {
    getpeerid("tc2");
    $('#callto-id').val("user2");
});

$('#twincam3').click(function () {
    getpeerid("tc3");
    $('#callto-id').val("user3");
});

$('#twincam4').click(function () {
    getpeerid("tc4");
    $('#callto-id').val("user4");
});

$('#user1').click(function () {
    getpeerid("user1");
    $('#callto-id').val("tc1");
    isReceive = true;
});

$('#user2').click(function () {
    getpeerid("user2");
    $('#callto-id').val("tc2");
    isReceive = true;
});

$('#user3').click(function () {
    getpeerid("user3");
    $('#callto-id').val("tc3");
    isReceive = true;
});

$('#user4').click(function () {
    getpeerid("user4");
    $('#callto-id').val("tc4");
    isReceive = true;
});

$('#recieve').click(function () {
    getpeerid(null);
    $('#callto-id').val("tc");
    isReceive = true;
});

$('#random').click(function () {
    getpeerid(null);
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
        alert(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    peer.on('close', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    peer.on('disconnected', function () {
        alert(err.message);
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
}