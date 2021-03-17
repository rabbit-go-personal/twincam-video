//'use strict';    //使わなくてもいいや 書き方を厳しくチェックするもの。あるとバグが起きにくくなりやすい。らしい

let localStream = null;
let peer = null;
let existingCall = null;
let isReceive = false;    //受信専用かどうか
const MAIN_VIDEO_CODEC = 'VP9';
let vidCodec = null;

let mediaRecorder = null;
let chunks = [];    // 録画でデータを保持する
let rcvStream = null;
let dataType = null;

const STATS_INTERVAL = 1000;    //Statsを保存する間隔 ms
let statsCount = 0;
let timer;
let data_csv = "";

let videoTrack;
let capabilities;
let constraints;
let settings;
let room;
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
                    $('#width').val(settings.width);           //今の解像度をresolutionのformに表示
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
        key: '829682c4-f853-4d97-8691-aa0c10064efd',     //APIkey
        debug: 3
    });
    
    start();//イベント確認
}
//peeridを取得
function getpeerroom(roomid,idname) {
    //ボタンをすべて消す　PeerIDがサーバーに残ってしまい初期化ができない
    $('#peerid-ui').hide();

    //peerオブジェクトの作成
    peer = new Peer(roomid, {
        key: '829682c4-f853-4d97-8691-aa0c10064efd',     //APIkey
        debug: 3
    });
    roomstart(idname);//イベント確認
}
//送受信の設定
function setCallOption(recieve, vCod) {
    isReceive = recieve;
    $('#isrcv').text(isReceive);
    vidCodec = vCod;
    $('#videocod').text(vidCodec);
}

//peeridの選択
$('#twincamL').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tcL");

    $('#callto-id').val("userL");
});

$('#twincamR').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tcR");
    $('#callto-id').val("userR");
});

$('#twincam1').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc1");
    $('#callto-id').val("user1");
});

$('#twincam2').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc2");
    $('#callto-id').val("user2");
});

$('#twincam3').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc3");
    $('#callto-id').val("user3");
});

$('#twincam4').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc4");
    $('#callto-id').val("user4");
});

$('#twincam5').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc5");
    $('#callto-id').val("user5");
});

$('#twincam6').click(function () {
    setCallOption(false, MAIN_VIDEO_CODEC);
    getpeerid("tc6");
    $('#callto-id').val("user6");
});

$('#userL').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("userL");
    $('#callto-id').val("tcL");
});

$('#userR').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("userR");
    $('#callto-id').val("tcR");
});

$('#user1').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user1");
    $('#callto-id').val("tc1");
});

$('#user2').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user2");
    $('#callto-id').val("tc2");
});

$('#user3').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user3");
    $('#callto-id').val("tc3");
});

$('#user4').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user4");
    $('#callto-id').val("tc4");
});

$('#user5').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user5");
    $('#callto-id').val("tc5");
});

$('#user6').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("user6");
    $('#callto-id').val("tc6");
});

$('#ln1').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("ln1");
    $('#callto-id').val("ALR1");
});

$('#ln2').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid("ln2");
    $('#callto-id').val("ALR2");
});

$('#room1left').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerroom("Room1","tcL");

});

$('#room1right').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerroom("Room1","tcR");
});

$('#recieve').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid();
    $('#callto-id').val("tc");
});

$('#random').click(function () {
    setCallOption(true, MAIN_VIDEO_CODEC);
    getpeerid();
});

//Recordボタン
$('#locrecstart').click(function () {
    recStart(localStream);
});

$('#rcvrecstart').click(function () {
    recStart(rcvStream);
});

function recStart(stream) {
    //チェック
    if (!stream) {
        $('#console').text("stream not ready");
        return;
    }
    if (mediaRecorder) {
        $('#console').text("already recording");
        return;
    }

    mediaRecorder = new MediaRecorder(stream); //録画用のインスタンス作成
    chunks = [];                               //格納場所をクリア

    // 一定間隔で録画が区切られて、データが渡される
    mediaRecorder.ondataavailable = function(evt) {
        chunks.push(evt.data);
        dataType = evt.data.type;
    }

    //録画停止時のイベント
    mediaRecorder.onstop = function (evt) {
        //保存用URLの生成
        let videoBrob = new Blob(chunks, { type: dataType });
        let anchor = $('#downloadlink-video').get(0);
        anchor.text = 'Download Record';
        anchor.download = 'recorded.webm';
        anchor.href = window.URL.createObjectURL(videoBrob);
        mediaRecorder = null;
    }

    mediaRecorder.start(1000); //録画開始 1000ms 毎に録画データを区切る
    $('#console').text("video recorder started");
}

//録画停止
$('#recstop').click(function () {
    if (mediaRecorder) {
        mediaRecorder.stop();   //録画停止
        $('#console').text("recorder stopped");
    }
});

//Statsボタン
$('#getting-stats').on('click', () => {
    //setIntervalでSTATS_INTERVALで指定した間隔でgetRTCStatsを実行する
    timer = setInterval(() => {
        getRTCStats(existingCall._negotiator._pc.getStats())
    }, STATS_INTERVAL);
});

$('#stop-acquiring-stats').on('click', () => {
    clearInterval(timer);

    let bom = new Uint8Array([0xEF, 0xBB, 0xBF]);                       //文字コードをBOM付きUTF-8に指定
    let statsBrob = new Blob([bom, data_csv], { "type": "text/csv" });  //data_csvのデータをcsvとしてダウンロードする関数
    let anchor = $('#downloadlink-stats').get(0);
    anchor.text = 'Download Stats';
    anchor.download = 'stats.csv';
    anchor.href = window.URL.createObjectURL(statsBrob);
    //初期化
    data_csv = "";
    statsCount = 0;
});

async function getRTCStats(statsObject) {

    //let trasportArray = [];
    //let candidateArray = [];
    //let candidatePairArray = [];
    //let inboundRTPAudioStreamArray = [];
    //let inboundRTPVideoStreamArray = [];
    //let outboundRTPAudioStreamArray = [];
    //let outboundRTPVideoStreamArray = [];
    //let codecArray = [];
    let mediaStreamTrack_senderArray = [];
    let mediaStreamTrack_receiverArray = [];
    //let mediaStreamTrack_local_audioArray = []
    //let mediaStreamTrack_remote_audioArray = []
    let mediaStreamTrack_local_videoArray = []
    let mediaStreamTrack_remote_videoArray = []
    //let candidatePairId = '';
    //let localCandidateId = '';
    //let remoteCandidateId = '';
    //let localCandidate = {};
    //let remoteCandidate = {};
    //let inboundAudioCodec = {};
    //let inboundVideoCodec = {};
    //let outboundAudioCode = {};
    //let outboundVideoCode = {};

    let stats = await statsObject;
    stats.forEach(stat => {
    //if (stat.id.indexOf('RTCTransport') !== -1) {
    //    trasportArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCIceCandidatePair') !== -1) {
    //    candidatePairArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCIceCandidate_') !== -1) {
    //    candidateArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCInboundRTPAudioStream') !== -1) {
    //    inboundRTPAudioStreamArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCInboundRTPVideoStream') !== -1) {
    //    inboundRTPVideoStreamArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCOutboundRTPAudioStream') !== -1) {
    //    outboundRTPAudioStreamArray.push(stat);
    //}
    //if (stat.id.indexOf('RTCOutboundRTPVideoStream') !== -1) {
    //    outboundRTPVideoStreamArray.push(stat);
    //}
    if (stat.id.indexOf('RTCMediaStreamTrack_sender') !== -1) {
        mediaStreamTrack_senderArray.push(stat);
    }
    if (stat.id.indexOf('RTCMediaStreamTrack_receiver') !== -1) {
        mediaStreamTrack_receiverArray.push(stat);
    }
    //if (stat.id.indexOf('RTCCodec') !== -1) {
    //    codecArray.push(stat);
    //}
    });

    //trasportArray.forEach(transport => {
    //    if (transport.dtlsState === 'connected') {
    //        candidatePairId = transport.selectedCandidatePairId;
    //    }
    //});
    //candidatePairArray.forEach(candidatePair => {
    //    if (candidatePair.state === 'succeeded' && candidatePair.id === candidatePairId) {
    //        localCandidateId = candidatePair.localCandidateId;
    //        remoteCandidateId = candidatePair.remoteCandidateId;
    //    }
    //});
    //candidateArray.forEach(candidate => {
    //    if (candidate.id === localCandidateId) {
    //        localCandidate = candidate;
    //    }
    //    if (candidate.id === remoteCandidateId) {
    //        remoteCandidate = candidate;
    //    }
    //});
    //inboundRTPAudioStreamArray.forEach(inboundRTPAudioStream => {
    //    codecArray.forEach(codec => {
    //        if (inboundRTPAudioStream.codecId === codec.id) {
    //            inboundAudioCodec = codec;
    //        }
    //    });
    //});
    //inboundRTPVideoStreamArray.forEach(inboundRTPVideoStream => {
    //    codecArray.forEach(codec => {
    //        if (inboundRTPVideoStream.codecId === codec.id) {
    //            inboundVideoCodec = codec;
    //        }
    //    });
    //});
    //outboundRTPAudioStreamArray.forEach(outboundRTPAudioStream => {
    //    codecArray.forEach(codec => {
    //        if (outboundRTPAudioStream.codecId === codec.id) {
    //            outboundAudioCodec = codec;
    //        }
    //    });
    //});
    //outboundRTPVideoStreamArray.forEach(outboundRTPVideo => {
    //    codecArray.forEach(codec => {
    //        if (outboundRTPVideo.codecId === codec.id) {
    //            outboundVideoCodec = codec;
    //        }
    //    });
    //});
    mediaStreamTrack_senderArray.forEach(mediaStreamTrack => {
        if (mediaStreamTrack.kind === 'audio') {
            //mediaStreamTrack_local_audioArray.push(mediaStreamTrack)
        } else if (mediaStreamTrack.kind === 'video') {
            mediaStreamTrack_local_videoArray.push(mediaStreamTrack)
        }
    });
    mediaStreamTrack_receiverArray.forEach(mediaStreamTrack => {
        if (mediaStreamTrack.kind === 'audio') {
            //mediaStreamTrack_remote_audioArray.push(mediaStreamTrack)
        } else if (mediaStreamTrack.kind === 'video') {
            mediaStreamTrack_remote_videoArray.push(mediaStreamTrack)
        }
    });

    //力技　先に0で宣言しといて，tryで代入失敗したら無視する
    let lfHei = 0;
    let lfWid = 0;
    let lfSen = 0;
    let rfHei = 0;
    let rfWid = 0;
    let rfRec = 0;

    try {
        lfHei = mediaStreamTrack_local_videoArray[0].frameHeight;
        lfWid = mediaStreamTrack_local_videoArray[0].frameWidth;
        lfSen = mediaStreamTrack_local_videoArray[0].framesSent;
    } catch (e) {} 
    try {
        rfHei = mediaStreamTrack_remote_videoArray[0].frameHeight;
        rfWid = mediaStreamTrack_remote_videoArray[0].frameWidth;
        rfRec = mediaStreamTrack_remote_videoArray[0].framesReceived;
    } catch (e) {} 

    $('#local-video').text('frameHeight:' + lfHei
                            + ' frameWidth:' + lfWid
                            + ' framesSent:' + lfSen);
    $('#remote-video').text('frameHeight:' + rfHei
                             + ' frameWidth:' + rfWid
                             + ' framesReceived:' + rfRec);

    data_csv += statsCount * STATS_INTERVAL + ','
        + lfHei + ','
        + lfWid + ','
        + lfSen + ','
        + rfHei + ','
        + rfWid + ','
        + rfRec + "\n";

    statsCount++;
}

//reloadボタン
$('#reload').click(function () {
    location.reload(true);
});

//発信処理
$('#make-call').submit(function (e) {
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream, {
        videoCodec: vidCodec,
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
        call.answer(localStream, { videoCodec: vidCodec });
        setupCallEventHandlers(call);
    });
}
//イベント id取得後じゃないと動作しない
function roomstart(id) {
    //openイベント
    room.on('open', function () {
        $('#my-id').text(peer.id);
        room = peer.joinRoom(id, {
            mode: "sfu",
            stream: localStream,
        });
    });

    //errorイベント
    room.on('error', function (err) {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    room.on('close', function () {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    room.on('disconnected', function () {
        //alert(err.message);
        $('#console').text(err.message);
        setupMakeCallUI();
    });

    //着信処理
    room.on('call', function (call) {
        call.answer(localStream, { videoCodec: vidCodec });
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