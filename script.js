const INPUT = {
    R: 0x01,
    G: 0x02,
    B: 0x04,
    Y: 0x08,
    P: 0x10,
    U: 0x20,
    D: 0x40
};

let inputLogUD = [];
let countWindow = 5; //5秒の入力回数を平均
let maxBPM = 0;
let beforeInput = 0;

// 現在時刻から一定秒以内の入力回数をカウントし、平均秒速を計算する関数
function CalculateSpeed(currentTime, inputLog) {
    inputLogUD.push(currentTime);
    
    // 規定秒以上前の入力を削除
    inputLog = inputLog.filter(timestamp => currentTime - timestamp <= countWindow*1000);

    // 直近3秒の平均秒速をBPMに換算(秒速4n回 = BPM 60nの16分 => 秒速n回 = BPM 15nの16分)
    let ave = (inputLog.length / (countWindow * 1.0));
    let speed = ave * 15.0
    //console.log("time"+ currentTime + " ave"+ ave +" speed:" + speed.toFixed(2));
    return { updatedLog: inputLog, speed };
}

document.getElementById('connect').addEventListener('click', async () => {
    try {
        // HIDデバイスにアクセスするためのユーザーの許可を得る
        const [device] = await navigator.hid.requestDevice({ filters: [] });

        if (!device) {
            console.log("デバイスが選択されませんでした。");
            return;
        }

        // 選択したデバイスに接続
        await device.open();
        document.getElementById('inputLog').value += "接続済:" + device.productName;
        
        // デバイスからの入力を受け取る
        device.addEventListener('inputreport', event => {
            const { data, reportId } = event;
            const currentTime = Date.now();

            // ボタンとピックのByteを取得
            const controllerInput = data.getUint8(6); 

            //直前の入力と比較して、ピック入力だったときだけカウントしたい
            if ((beforeInput & (INPUT.U | INPUT.D)) !== (controllerInput & (INPUT.U | INPUT.D))) {
                if (controllerInput & (INPUT.U | INPUT.D)) {
                console.log("input");
                // 入力ログを更新し、平均秒速を計算
                const result = CalculateSpeed(currentTime, inputLogUD);
                inputLogUD = result.updatedLog;
                const speed = result.speed;
                document.getElementById('currentSpeed').value = speed.toFixed(0);
                
                if (maxBPM < speed) {
                    maxBPM = speed;
                    document.getElementById('maxSpeed').value = maxBPM.toFixed(0); // 整数型に変換して設定
                    UpdateMusicSample(maxBPM);
                }
            }
            }
            beforeInput = controllerInput;
            //データを全表示するときはこちらを使う
            /*
            // データを16進数の文字列として処理
            let hexString = '';
            for (let i = 0; i < data.byteLength; i++) {
                hexString += data.getUint8(i).toString(16).padStart(2, '0') + ' ';
            }
            // テキストエリアに表示
            document.getElementById('inputLog').value += `Report ID: ${reportId}, Data: ${hexString.trim()}\n`;
            */
        
            // let resultString = '';

            // // 各ビットをチェックして対応する文字列を組み立てる
            // if (specificByte & INPUT.R) resultString += 'R';
            // if (specificByte & INPUT.G) resultString += 'G';
            // if (specificByte & INPUT.B) resultString += 'B';
            // if (specificByte & INPUT.Y) resultString += 'Y';
            // if (specificByte & INPUT.P) resultString += 'P';
            // resultString += ' '
            // if (specificByte & INPUT.U) resultString += 'U';
            // if (specificByte & INPUT.D) resultString += 'D';

            UpdateColorBox(controllerInput);
            //document.getElementById('inputLog').value += `Values: ${resultString.trim()}\n`;
        });

    } catch (error) {
        console.error("HIDデバイスへの接続に失敗しました: ", error);
    }
});

document.getElementById('clear').addEventListener('click', () => {
    document.getElementById('currentSpeed').value = '';
    document.getElementById('maxSpeed').value = '';
    document.getElementById('musicSample').value = '';
    inputLogUD = [];
    maxBPM = 0;
});

function UpdateColorBox(inputByte){
    document.getElementById('R').style.backgroundColor = (inputByte & INPUT.R) ? 'red' : 'white';
    document.getElementById('G').style.backgroundColor = (inputByte & INPUT.G) ? 'lime' : 'white';
    document.getElementById('B').style.backgroundColor = (inputByte & INPUT.B) ? '#0d33ff' : 'white';
    document.getElementById('Y').style.backgroundColor = (inputByte & INPUT.Y) ? '#ffe500' : 'white';
    document.getElementById('P').style.backgroundColor = (inputByte & INPUT.P) ? 'fuchsia' : 'white';

    const PickBox = document.getElementById('Pick');
    if (inputByte & INPUT.U && inputByte & INPUT.D) {
        PickBox.style.background = 'black';
    } else if (inputByte & INPUT.U) { //Up
        PickBox.style.background = 'linear-gradient(to bottom, black 50%, white 50%)';
    } else if (inputByte & INPUT.D) { //Down
        PickBox.style.background = 'linear-gradient(to top, black 50%, white 50%)';
    } else {
        PickBox.style.background = 'white';
    }
}

//出典：https://w.atwiki.jp/gtdr/pages/23.html と BEMANIWiki
const bpmRanges = [
    { minBPM: 120, maxBPM: 130, texts: ["花の唄", "永", "等"] },
    { minBPM: 130, maxBPM: 140, texts: ["r.p.m.RED", "GORI GORI", "REFLEXES MANIPULATION", "等"] },
    { minBPM: 140, maxBPM: 150, texts: ["GET IT ALL", "Limitless Possibility", "MIND ERUPTION", "等"] },
    { minBPM: 150, maxBPM: 160, texts: ["MODEL DD6", "Terra Car", "BLACK JACKAL", "等"] },
    { minBPM: 160, maxBPM: 170, texts: ["愛と勇気の三度笠ポン太", "Synergy For Angels", "等"] },
    { minBPM: 170, maxBPM: 180, texts: ["Hyperseven type K", "Link up", "ECLIPSE 2", "等"] },
    { minBPM: 180, maxBPM: 184, texts: ["MAD BLAST", "Strike Party!!!", "たまゆら", "等"] },
    { minBPM: 184, maxBPM: 190, texts: ["ancient breeze", "DESTINY", "等"] },
    { minBPM: 190, maxBPM: 200, texts: ["SUZY AND THE TIME MACHINE", "お米の美味しい炊き方、そしてお米を食べることによるその効果。", "等"] },
    { minBPM: 200, maxBPM: 210, texts: ["BLACK ROSES", "悠久のPEGASUS", "RISE", "等"] },
    { minBPM: 210, maxBPM: 220, texts: ["under control", "子供の落書き帳", "等"] },
    { minBPM: 220, maxBPM: 225, texts: ["Eau Rouge", "The Legend", "等"] },
    { minBPM: 225, maxBPM: 232, texts: ["OVER THE LIMIT!", "MODEL DD10"] },
    { minBPM: 232, maxBPM: 238, texts: ["しっぽのロック"] },
    { minBPM: 238, maxBPM: 240, texts: ["風神雲龍伝"] },
    { minBPM: 240, maxBPM: 247.5, texts: ["Purple storm", "Shake and Shout!!", "MODEL DD9", "等"] },
    { minBPM: 247.5, maxBPM: 250, texts: ["Confession"] },
    { minBPM: 250, maxBPM: 255, texts: ["X-Plan", "over there"] },
    { minBPM: 255, maxBPM: 262.5, texts: ["Blaze line", "CALAMITY PHOENIX"] },
    { minBPM: 262.5, maxBPM: 270, texts: ["Deep Forest", "SIX DIMENSION", "等"] },
    { minBPM: 270, maxBPM: 280, texts: ["Fate of the Furious", "ギタドラシカ", "等"] },
    { minBPM: 280, maxBPM: 285, texts: ["LIGHTNING"] },
    { minBPM: 285, maxBPM: 288, texts: ["White wings"] },
    { minBPM: 288, maxBPM: 291, texts: ["Under The Shades Of The Divine Ray"] },
    { minBPM: 291, maxBPM: 9999, texts: ["IMI"] }
];

function UpdateMusicSample(maxBPM) {
    let textToShow = '';

    // 与えられたmaxBPMがどの範囲に該当するかを探索する
    for (const range of bpmRanges) {
        if (maxBPM >= range.minBPM && maxBPM < range.maxBPM) {
            // 範囲内のテキストを全て連結する
            textToShow = range.texts.join('\n');
            break;
        }
    }
    document.getElementById('musicSample').value = textToShow;
}