import { DataSource } from "apollo-datasource";

export type Entity = {
  namespaceId: string;
  id: string;
  createdById: string;
  type: string;
  properties: any;
  history?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Generic interface to the database.
 */
export interface DBAdapter extends DataSource {
  /**
   * Create a new entity. If "id" is not provided it will be automatically generated. To
   * create a versioned entity, set the optional parameter "versioned" to `true`.
   * */
  createEntity(params: {
    namespaceId: string;
    id?: string;
    createdById: string;
    type: string;
    versioned?: boolean;
    properties: any;
  }): Promise<Entity>;

  /** Get an entity by ID in a given namespace. */
  getEntity(params: {
    namespaceId: string;
    id: string;
  }): Promise<Entity | undefined>;

  /** Update an entity's properties. If the parameter "type" is provided, the function
   * checks that the entity's type matches before updating.
   */
  updateEntity(params: {
    namespaceId: string;
    id: string;
    type?: string;
    properties: any;
  }): Promise<Entity | undefined>;

  /** Get all entities of a given type. */
  getEntitiesByType(params: {
    namespaceId: string;
    type: string;
  }): Promise<Entity[]>;

  /** Get all namespace entities in the database, that is, those entities where the
   * namespace ID equals the entity ID
   */
  getNamespaceEntities(): Promise<Entity[]>;
}
