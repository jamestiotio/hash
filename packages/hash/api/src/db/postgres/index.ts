import { DataSource } from "apollo-datasource";
import { StatsD } from "hot-shots";
import { Logger } from "@hashintel/hash-backend-utils/logger";
import {
  createPostgresConnPool,
  PgPool,
} from "@hashintel/hash-backend-utils/postgres";

import { PostgresClient } from "./client";
import {
  DBAdapter,
  DBClient,
  Entity,
  EntityMeta,
  EntityType,
  EntityVersion,
  VerificationCode,
} from "../adapter";
import { SystemType } from "../../types/entityTypes";

export type Config = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  maxPoolSize: number;
};

export class PostgresAdapter extends DataSource implements DBAdapter {
  private statsdInterval: NodeJS.Timeout;
  private pool: PgPool;

  constructor(cfg: Config, logger: Logger, statsd?: StatsD) {
    super();
    this.pool = createPostgresConnPool(logger, cfg);
    this.statsdInterval = setInterval(() => {
      const state = this.pool.getPoolState();
      statsd?.gauge("pool_waiting_count", state.waitingClientCount);
      statsd?.gauge("pool_idle_count", state.idleConnectionCount);
    }, 5000);
  }

  /** Close all connections to the database. This function is idempotent. */
  async close() {
    if (this.pool.getPoolState().ended) {
      return;
    }
    clearInterval(this.statsdInterval);
    return await this.pool.end();
  }

  private async query<T>(fn: (client: DBClient) => Promise<T>): Promise<T> {
    return await this.pool.connect(async (conn) => {
      const client = new PostgresClient(conn);
      return await fn(client);
    });
  }

  /** Initiate a new database transaction. All `DBAdapter` methods called within
   * the provided callback `fn` are executed within the same transaction.
   * */
  async transaction<T>(
    fn: (adapter: PostgresClient) => Promise<T>,
  ): Promise<T> {
    return await this.pool.connect(async (conn) => {
      return await conn.transaction(async (tx) => {
        const client = new PostgresClient(tx);
        return await fn(client);
      });
    });
  }

  createEntityType(params: {
    accountId: string;
    createdById: string;
    name: string;
    schema?: Record<string, any>;
  }): Promise<EntityType> {
    return this.query((adapter) => adapter.createEntityType(params));
  }

  createEntity(params: {
    accountId: string;
    entityVersionId?: string;
    entityTypeId?: string;
    entityTypeVersionId?: string;
    systemTypeName?: SystemType;
    createdById: string;
    versioned: boolean;
    properties: any;
  }): Promise<Entity> {
    return this.query((adapter) => adapter.createEntity(params));
  }

  getEntityAccountId(params: {
    entityId: string;
    entityVersionId?: string;
  }): Promise<string> {
    return this.query((adapter) => adapter.getEntityAccountId(params));
  }

  getEntity(params: {
    accountId: string;
    entityVersionId: string;
  }): Promise<Entity | undefined> {
    return this.query((adapter) => adapter.getEntity(params));
  }

  getEntityLatestVersion(params: {
    accountId: string;
    entityId: string;
  }): Promise<Entity | undefined> {
    return this.query((adapter) => adapter.getEntityLatestVersion(params));
  }

  getEntityTypeLatestVersion(params: {
    entityTypeId: string;
  }): Promise<EntityType | null> {
    return this.query((adapter) => adapter.getEntityTypeLatestVersion(params));
  }

  getSystemTypeLatestVersion(params: {
    systemTypeName: SystemType;
  }): Promise<EntityType> {
    return this.query((adapter) => adapter.getSystemTypeLatestVersion(params));
  }

  updateEntityType(params: {
    accountId: string;
    createdById: string;
    entityId: string;
    newName?: string;
    newSchema?: Record<string, any>;
  }): Promise<EntityType> {
    return this.query((adapter) => adapter.updateEntityType(params));
  }

  updateEntity(params: {
    accountId: string;
    entityId: string;
    properties: any;
  }): Promise<Entity> {
    return this.query((adapter) => adapter.updateEntity(params));
  }

  updateEntityAccountId(params: {
    originalAccountId: string;
    entityId: string;
    newAccountId: string;
  }): Promise<void> {
    return this.query((adapter) => adapter.updateEntityAccountId(params));
  }

  getUserByEmail(params: {
    email: string;
    verified?: boolean;
    primary?: boolean;
  }): Promise<Entity | null> {
    return this.query((adapter) => adapter.getUserByEmail(params));
  }

  getUserByShortname(params: { shortname: string }): Promise<Entity | null> {
    return this.query((adapter) => adapter.getUserByShortname(params));
  }

  getOrgByShortname(params: { shortname: string }): Promise<Entity | null> {
    return this.query((adapter) => adapter.getOrgByShortname(params));
  }

  getEntitiesByType(params: {
    entityTypeId: string;
    entityTypeVersionId?: string;
    accountId: string;
    latestOnly: boolean;
  }): Promise<Entity[]> {
    return this.query((adapter) => adapter.getEntitiesByType(params));
  }

  getEntitiesBySystemType(params: {
    accountId: string;
    systemTypeName: SystemType;
    latestOnly?: boolean;
  }): Promise<Entity[]> {
    return this.query((adapter) => adapter.getEntitiesBySystemType(params));
  }

  accountExists(params: { accountId: string }): Promise<boolean> {
    return this.query((adapter) => adapter.accountExists(params));
  }

  getAllAccounts(): Promise<Entity[]> {
    return this.query((adapter) => adapter.getAllAccounts());
  }

  updateEntityMetadata(params: {
    accountId: string;
    entityId: string;
    extra: any;
  }): Promise<EntityMeta> {
    return this.query((adapter) => adapter.updateEntityMetadata(params));
  }

  createVerificationCode(params: {
    accountId: string;
    userId: string;
    code: string;
    emailAddress: string;
  }): Promise<VerificationCode> {
    return this.query((adapter) => adapter.createVerificationCode(params));
  }

  getVerificationCode(params: {
    id: string;
  }): Promise<VerificationCode | null> {
    return this.query((adapter) => adapter.getVerificationCode(params));
  }

  getUserVerificationCodes(params: {
    userEntityId: string;
    createdAfter?: Date;
  }): Promise<VerificationCode[]> {
    return this.query((adapter) => adapter.getUserVerificationCodes(params));
  }

  incrementVerificationCodeAttempts(params: {
    id: string;
    userId: string;
  }): Promise<void> {
    return this.query((adapter) =>
      adapter.incrementVerificationCodeAttempts(params),
    );
  }

  setVerificationCodeToUsed(params: {
    id: string;
    userId: string;
  }): Promise<void> {
    return this.query((adapter) => adapter.setVerificationCodeToUsed(params));
  }

  pruneVerificationCodes(params: { maxAgeInMs: number }): Promise<number> {
    return this.query((adapter) => adapter.pruneVerificationCodes(params));
  }

  getEntityHistory(params: {
    accountId: string;
    entityId: string;
    order: "asc" | "desc";
  }): Promise<EntityVersion[]> {
    return this.query((adapter) => adapter.getEntityHistory(params));
  }

  getEntities(
    entities: {
      accountId: string;
      entityId: string;
      entityVersionId?: string;
    }[],
  ): Promise<Entity[]> {
    return this.query((adapter) => adapter.getEntities(entities));
  }

  getAccountEntityTypes(params: {
    accountId: string;
    includeOtherTypesInUse?: boolean | null;
  }): Promise<EntityType[]> {
    return this.query((adapter) => adapter.getAccountEntityTypes(params));
  }

  acquireEntityLock = (params: { entityId: string }): Promise<null> => {
    return this.query((adapter) => adapter.acquireEntityLock(params));
  };

  getImpliedEntityHistory = (params: {
    accountId: string;
    entityId: string;
  }) => {
    return this.query((adapter) => adapter.getImpliedEntityHistory(params));
  };

  getAncestorReferences(params: {
    accountId: string;
    entityId: string;
    depth?: number;
  }) {
    return this.query((adapter) => adapter.getAncestorReferences(params));
  }

  getSystemAccountId() {
    return this.query((adapter) => adapter.getSystemAccountId());
  }

  getChildren(params: {
    accountId: string;
    entityId: string;
    entityVersionId: string;
  }) {
    return this.query((adapter) => adapter.getChildren(params));
  }
}
