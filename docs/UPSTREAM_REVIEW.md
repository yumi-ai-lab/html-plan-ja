# 参照元の評価

確認日: 2026-11-03。これはコミュニティ版html-planの特定スナップショットに対する評価で、本リポジトリの完成証明ではない。

## 出典

- [html-plan](https://github.com/anthropics/claude-plugins-community/tree/main/html-plan): manifestではversion 1.0.0。
- [OpenAIのパッケージ形式](https://developers.openai.com/plugins/build/plugins): root plugin.json + skills/を使う可搬構成。
- [Claudeプラグイン移植の案内](https://developers.openai.com/plugins/guides/submit-claude-plugin): ホスト固有部分の調整と検証が必要。
- [ライセンスに関する既存の質問 #2403](https://github.com/anthropics/claude-plugins-community/issues/2403)。

## 観測した結果

Node.js 22.14.0 / Windowsで配布元のpackerを評価。サンプルHTMLの生成に成功したが、サンプルが参照する別プロジェクトのソース不在について6警告が出た。日本語の試作では8警告が出て、英語の文章判定と試作用の構造不足が含まれた。

Chromiumで、折りたたみ、選択、日本語コメント、ブラウザー内保存と再読込、回答Markdown生成を確認。390pxの本文と回答ダイアログは横にはみ出さなかった。ダークモードでは白い選択面に明るい文字が重なり、可読性の問題を確認した。

評価した試作では外部リソース通信を観測しなかった。これはすべての入力や元ツール全体についての安全保証ではない。iPhone Safari、全ブロック、ホストインストール、OKF自動同期は未検証。

## 再現用の上流blob SHA

| 対象 | SHA |
| --- | --- |
| SKILL.md | 140f8756f752f2abf718307f0fad2cd2dc715463 |
| pack.mjs | 710a96c43747139bb1c85f46eccea05b61c6c9ec |
| htmlplan.js | e8696b30c123e8cedae8d874c78cd07fa2537b1c |
| htmlplan.css | c2414ee57a3210cee237336d9ddf9344789bd5bd |

## 本リポジトリでの扱い

上流manifestのMIT表記とroot LICENSEのApache-2.0表記に不一致があり、上記の質問があった。適用関係をここで断定しない。

初版はコードを転載せず、新規の計画書式・画面見本・契約だけを作成する。元ツールの正式な翻訳・同機能の移植・公式認定版ではない。将来上流のコードを取り込む場合は、その時点のライセンスと必要な表示を確認してから別変更として扱う。
