<div id="top"></div>

# Experiment Timer WebApp

Experiment Timer WebApp は，実験中のタスク進行管理およびタスク開始時刻の記録を目的とした Web アプリケーションである．

本アプリでは，実験者が実施する実験を選択し，開始操作を行うことで，カウントダウン後に設定されたタスクを順番に実行する．各タスクの開始時刻および終了時刻を自動的に記録し，実験終了後に CSV ファイルとして保存できる．

実験内容やタスク時間は `experiments.json` で管理するため，JavaScript の変更なしに新しい実験条件を追加できる．

---

## 使用技術一覧

<p style="display: inline">
  <img src="https://img.shields.io/badge/-HTML5-E34F26.svg?logo=html5&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-CSS3-1572B6.svg?logo=css3&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-JavaScript-F7DF1E.svg?logo=javascript&style=for-the-badge&logoColor=black">
  <img src="https://img.shields.io/badge/-JSON-000000.svg?style=for-the-badge&logo=json&logoColor=white">
  <img src="https://img.shields.io/badge/-CSV-217346.svg?style=for-the-badge&logoColor=white">
</p>

---

## 目次

* [プロジェクトについて](#プロジェクトについて)
* [ファイル構成](#ファイル構成)
* [設定ファイル](#設定ファイル)
* [画面構成](#画面構成)
* [実験制御](#実験制御)
* [ログデータ](#ログデータ)
* [キーボード操作](#キーボード操作)
* [使用方法](#使用方法)
* [注意点](#注意点)

---

## プロジェクトについて

Experiment Timer WebApp は，人体実験や評価実験における実験プロトコル管理を支援する Web アプリケーションである．

実験開始前に参加者 ID と実験条件を入力し，開始ボタンを押すことで 3 秒間のカウントダウンを実施する．カウントダウン終了後，設定されたタスクを順番に実行し，各タスクの開始時刻および終了時刻を記録する．

また，実験途中での一時停止，再開，キャンセル操作に対応しており，実験者の操作ミスや準備時間の発生にも対応できる．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## ファイル構成

```text
.
├── index.html
├── style.css
├── app.js
├── experiments.json
└── README.md
```

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## 設定ファイル

実験条件は `experiments.json` により管理する．

各実験には以下の情報を設定する．

| 項目         | 内容        |
| ---------- | --------- |
| `id`       | 実験識別用ID   |
| `name`     | 実験名       |
| `tasks`    | 実行するタスク一覧 |
| `name`     | タスク名      |
| `duration` | タスク時間 [s] |

設定例：

```json
{
  "id": "experiment1",
  "name": "実験1",
  "tasks": [
    {
      "name": "順応(5分)",
      "duration": 300
    },
    {
      "name": "安静(5分)",
      "duration": 300
    }
  ]
}
```

タスクを追加する場合は，`tasks` 配列へ要素を追加する．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## 画面構成

### 実験設定

画面上部では以下を設定する．

* 参加者 ID 入力
* 実験選択
* 実験開始
* 一時停止
* キャンセル
* CSV 保存

### 現在のタスク

現在実行中のタスク名と残り時間を表示する．

表示内容：

* 実行中タスク名
* 残り時間 [s]
* 実験状態

### タスク一覧

選択した実験に含まれるタスク一覧を表示する．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## 実験制御

### 開始処理

実験開始ボタンを押すと以下の処理を実行する．

1. 参加者 ID を取得する
2. 実験条件を読み込む
3. 3 秒間のカウントダウンを開始する
4. 0 秒時点で最初のタスクを開始する
5. タスク開始時刻を記録する

---

### タスク遷移

各タスクでは設定された時間を 1 秒単位で減算し，時間終了後に次のタスクへ移行する．

タスク終了時には以下を記録する．

* タスク名
* 開始時刻
* 終了時刻

---

### 終了前通知

各タスク終了 5 秒前から，1 秒ごとに通知音を再生する．

通知：

```text
残り5秒 → 音
残り4秒 → 音
残り3秒 → 音
残り2秒 → 音
残り1秒 → 音
```

実験者が画面を確認できない状況でも，タスク終了タイミングを把握できる．

---

## ログデータ

実験終了後，CSV ファイルを生成する．

ファイル名：

```text
参加者ID_実験ID_log.csv
```

例：

```text
P001_experiment1_log.csv
```

CSV 形式：

```csv
Participant,Task,Start,End
P001,順応(5分),2026/07/07 10:00:00.123,2026/07/07 10:05:00.456
P001,安静(5分),2026/07/07 10:05:00.789,2026/07/07 10:10:01.012
```

時刻は以下の形式で保存する．

```text
YYYY/MM/DD HH:MM:SS.ms
```

ミリ秒単位まで記録するため，センサデータなどとの時間同期にも利用できる．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## キーボード操作

実験中はキーボード操作に対応する．

| キー    | 操作        |
| ----- | --------- |
| Enter | 実験開始      |
| Space | 一時停止 / 再開 |
| Esc   | キャンセル     |

マウス操作を行わずに実験進行を制御できる．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## 使用方法

### 1．WebAppを開く

`index.html` をブラウザで開く．

ローカル環境で `experiments.json` を読み込む場合は，ローカルサーバ経由で起動する．

例：

```bash
python -m http.server 8000
```

ブラウザで以下へアクセスする．

```text
http://localhost:8000
```

---

### 2．参加者 ID を入力する

参加者 ID 欄へ実験対象者の ID を入力する．

例：

```text
P001
```

---

### 3．実験を選択する

実験選択欄から実施する実験を選択する．

---

### 4．実験を開始する

「実験開始」ボタンまたは `Enter` キーを押す．

3 秒間のカウントダウン後，自動的にタスクが開始される．

---

### 5．実験を制御する

必要に応じて以下の操作を行う．

* 一時停止
* 再開
* キャンセル

---

### 6．CSVを保存する

実験終了後，「CSV保存」ボタンを押すことでログファイルを保存する．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>

---

## 注意点

* `index.html`，`style.css`，`app.js`，`experiments.json` は同じ階層に配置する．
* `experiments.json` を変更した場合は，ブラウザを再読み込みする．
* 実験開始前に参加者 ID が入力されている必要がある．
* 実験中にページを閉じるとログデータは失われる．
* CSV は UTF-8 BOM 付きで保存され，Excel で開いた場合も日本語を表示できる．
* 実験条件を変更する場合は `experiments.json` のみ変更する．

<p align="right">(<a href="#top">トップへ戻る</a>)</p>
