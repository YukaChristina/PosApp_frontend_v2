import { useState } from "react";
import type { CSSProperties } from "react";

/*商品情報の型定義, Typescriptの厳格な型システムに合わせている*/
type Product = {
  code: string;
  name: string;
  price: number;
};

type CartItem = Product & {qty: number}; /*カートの中身はProductと同じ構造*/

/*Next.jsのページコンポーネント ここでreturnしたJSXがページとして描画される*/
export default function Home() {
  const TAX_RATE = 0.10; // 10%（必要なら変更）  
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]); /*カートの中身を保持するステート*/
  const [showResult, setShowResult] = useState(false); /*検索結果を表示するかどうかのフラグ*/
  const [showPopup, setShowPopup] = useState(false); /*ポップアップ表示のフラグ*/
  const [totals, setTotals] = useState<{excl: number; incl: number}>({excl: 0, incl: 0}); /*合計金額を保持するステート*/

  const addBtnStyle: CSSProperties = {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "blue",
    color: "white",
    border: "none",
    width: "400px",
    cursor: product ? "pointer" : "not-allowed", /*productがあるときはポインター、ないときは禁止マーク*/
    opacity: product ? 1 : 0.5 /*productがあるときは不透明、ないときは半透明*/
  };
  const handleSearch = async () => {
    try {
      const res = await fetch(`https://${process.env.NEXT_PUBLIC_API_ENDPOINT}products/search?code=${code}`); /*バックエンドへ商品コードを送信する*/
      if(!res.ok) throw new Error("商品が見つかりません"); /*HTTPエラーが出た場合、出なかった場合は以下の通り。*/
      const data = await res.json(); /*レスポンスボディをJSONとしてdata変数に引き渡す*/
      setProduct(data); /*dataをproductステートにセット*/
      setShowResult(true); /*検索結果を表示*/
      setError(""); /*成功したのでエラーは空欄*/
    } catch(err:any){ /*通信失敗や404エラーなどのときにエラーを表示し、productを消す*/
      setError(err.message);
      setProduct(null);
    }
  };

  const handleAddToCart = () => {
    if(!product) return; /*productがnullのときは何もしない*/
    setCart(prev => [...prev, product]); /*いま検索結果に表示されている商品（product）を既存のカート(prev)に追加*/
    setProduct(null); /*カートに追加したら検索結果を消す*/
    setCode(""); /*商品コード入力欄もクリア*/
    setProduct(null); /*検索結果もクリア*/
    setShowResult(true); /*検索結果を非表示*/
  };

  // 合計の計算（税抜/税込）
  const computeTotals = (items: CartItem[]) => {
   const excl = items.reduce((sum, it) => sum + it.price * (it.qty ?? 1), 0);
   const incl = Math.round(excl * (1 + TAX_RATE));
   return { excl, incl };
 };
  
  // 購入実行（「購入する」ボタンの onClick に渡す）
const handlePurchase = async () => {
  try {
    // 0) カートが空なら合計0でポップアップだけ出す（仕様に合わせて変更可）
    if (cart.length === 0) {
      setTotals({ excl: 0, incl: 0 });
      setShowPopup(true);
      return;
    }

    // 1) 税抜合計／税込合計の計算
    const TAX_RATE = 0.10; // 既に上位で定義しているならこの行は省略
    const excl = cart.reduce((sum, it) => sum + it.price * (it.qty ?? 1), 0);
    const incl = Math.round(excl * (1 + TAX_RATE)); // 四捨五入（店のポリシーでceil/floorに変更可）

    // 2) サーバーへ送るペイロードを作成（API仕様に合わせてキー名を調整）
    const payload = {
        emp_cd: "E001",
        store_cd: "S01",
        pos_no:"P01",
      items: cart.map((it) => ({
        code: it.code,
        qty: it.qty ?? 1,
      })),
      
    };

    // 3) 購入APIに送信（URL・HTTPメソッドはあなたのAPI仕様に合わせて）
    const res = await fetch(`https://${process.env.NEXT_PUBLIC_API_ENDPOINT}purchase2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("購入処理に失敗しました");

    // 4) 合計をポップアップに表示
    const data = await res.json(); // { trd_id, total_amt, ttl_amt_ex_tax }
    // サーバ計算の結果で表示（バックと表示を一致させる）
    setTotals({  excl: data.ttl_amt_ex_tax, incl: data.total_amt });
    setShowPopup(true);

    // 5) 正常終了後はカートをクリア（仕様に応じて削除してもOK）
    setCart([]);
  } catch (e: any) {
    // 6) エラー表示（必要ならポップアップにもエラー用の表示を出す）
    setError(e.message ?? "予期せぬエラーが発生しました");
  }
};

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9f9f9",
      padding: "2rem"}}>
      <h1　style={{marginBottom:"2rem"}}>テクワンPOSシステム</h1>
      <input 
        type="text" 
        value={code} 
        onChange={(e) => setCode(e.target.value)} 
        placeholder="商品コードを入力"
        style={{
          border: "1px solid gray",
          padding: "0.5rem",
          fontSize: "1rem",
          width: "200px"
        }}
        />
      <button onClick={handleSearch} style={{padding: "2rem"}}>検索</button>
      {error && <p style={{color:"red"}}>{error}</p>}
        <div style={{marginTop: "1rem", padding: "1rem", border: "2px solid black", minHeight: "120px", width: "400px"}}>
          <p>商品コード: {product?.code ?? ""}</p> {/*product.CODEで商品コードを表示 必ず小文字！*/}
          <p>商品名: {product?.name ?? ""}</p> {/*product.NAMEで商品名を表示 必ず小文字！*/}
          <p>商品価格: {product?.price ?? ""}</p> {/*product.PRICEで価格を表示 必ず小文字！*/}
        </div>
     
        <div>
          <button 
            onClick={handleAddToCart} 
            disabled={!product} 
            style={addBtnStyle}
            >
                カートに追加
          </button>
        </div>
      
   {/*カートの中身を表示する部分。cartステートに1件以上入っているときだけ表示される*/}
       {/* カート表示 */}   
   
    <h3 style={{marginTop: "2rem"}}>購入リスト</h3>
  <div style={{ marginTop: "1rem", padding: "1rem", border: "2px solid black", height: "200px", width: "400px", overflowY: "auto" }}>
     {cart.length === 0 ? (
        <p style={{ color: "gray", margin: 0 }}>ここに購入商品が表示されます</p>
     ) : (
     cart.map((item, index) => {
      const unit = item.price;
      const subtotal = item.price;

      return (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "12px",
            padding: "2px 0",
            fontFeatureSettings: "'tnum' 1", // 数字の揃え（対応ブラウザ用）
          }}
        >
          {/* 商品名（可変幅、はみ出したら省略） */}
          <div style={{ flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </div>

          {/* 数量 */}
          <div style={{ flex: "0 0 auto", width: "52px", textAlign: "right" }}>
            <p>x 1</p>
          </div>

          {/* 単価 */}
          <div style={{ flex: "0 0 auto", width: "80px", textAlign: "right" }}>
            {unit}円
          </div>

          {/* 小計 */}
          <div style={{ flex: "0 0 auto", width: "80px", textAlign: "right" }}>
            {subtotal}円
          </div>
        </div>
      );
      
    })
)}
   
  </div>
  {/* 購入ボタン */}
    <div style={{ marginTop: "1rem" }}>
    <button 
        onClick={handlePurchase} 
        disabled={cart.length === 0} 
        style={{ 
            opacity: cart.length === 0 ? 0.5 : 1,
            cursor: cart.length === 0 ? "not-allowed" : "pointer",
            padding: "0.5rem 1rem", 
            width: "400px",
            backgroundColor: "green", 
            color: "white" }}>
        購入する
    </button>
    </div>

    {/* 購入完了ポップアップ */}
    {showPopup && (
    <div style={{
        position: "fixed",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        border: "2px solid black",
        padding: "2rem",
        zIndex: 1000
    }}>
        <h3>購入が完了しました！</h3>
        <p>合計金額（税抜）: {totals.excl}円</p>
        <p>合計金額（税込）: {totals.incl}円</p>
        <button onClick={() => setShowPopup(false)}>OK</button>
    </div>
    )}

    </div>
  );
} 
