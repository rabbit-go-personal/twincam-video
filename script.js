'use strict';

var localStream = null;
var peer = null;
let existingCall = null;
var isReceive = false;    //受信専用かどうか
const VIDEO_CODEC = 'VP9';

//カメラ映像、マイク音声の取得
function getmedia(video_option) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: video_option })
        .then(function (stream) {
            // Success
            $('#my-video').get(0).srcObject = stream;
            localStream = stream;
        }).catch(function (error) {
            // Error
            console.error('mediaDevice.getUserMedia() error:', error);
            return;
        });
}

//4K映像を取得
$('#4K').click(function () {
    getmedia({ width: { ideal: 3840 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } });
});

//FullHD映像を取得
$('#FullHD').click(function () {
    getmedia(true);
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