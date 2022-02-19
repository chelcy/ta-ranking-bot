/**
 * ChelcyNetwork APIの生のレスポンス
 */
export interface IRankingItemRaw {
  name: string;
  rank: number;
  time: number;
  epoch: number;
}

/**
 * ChelcyNetwork APIのレスポンス
 */
export interface IRankingItem extends IRankingItemRaw {
  uuid: string;
}

/**
 * get_athleticsから受信するアスレチック情報
 */
export interface IAthleticInfo {
  id: string;
  name: string;
}

/**
 * DynamoDBに保存するレコード
 */
export interface ITableRow extends IAthleticInfo {
  ranking: ITableRowRanking[];
}

/**
 * DynamoDBのレコードのranking
 */
export interface ITableRowRanking {
  uuid: string;
  epoch: number;
}

/**
 * minetoolsのUUIDのAPIのレスポンス
 */
export interface IMinetoolsUUID {
  cache: any;
  id: string;
  name: string;
  status: string;
}
