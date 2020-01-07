export default (UAParser)=>{
    //モバイルからアクセスがあった場合アクセス拒否
    if(UAParser().device.type === 'mobile') {
        alert('PCからアクセスしてください');
        location.replace('https://moritalab.inf.shizuoka.ac.jp/sites/inf-and-mind2019/');//戻るURL指定
    }

    // Chrome以外から閲覧されている場合アクセス拒否
    if (UAParser().browser.name !== 'Chrome' && UAParser().browser.name !== 'Firefox') {
            alert('ブラウザをChromeに変更してください');
            location.replace('https://moritalab.inf.shizuoka.ac.jp/sites/inf-and-mind2019/');//戻るURL指定  
    }
    
    // リロードや閉じる操作に対して警告
    window.onbeforeunload = (e) => {
        e.preventDefault();// Cancel the event as stated by the standard.
        e.returnValue = '';// Chrome requires returnValue to be set.
    }
};