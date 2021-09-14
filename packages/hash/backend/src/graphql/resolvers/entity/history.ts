import { Resolver, UnknownEntity } from "../../apiTypes.gen";
import { GraphQLContext } from "../../context";

export const history: Resolver<
  Promise<UnknownEntity["history"]>,
  UnknownEntity,
  GraphQLContext
> = async (entity, _, { dataSources }) => {
  if (!entity.entityId) {
    return undefined;
  }
  const versions = await dataSources.db.getEntityHistory({
    accountId: entity.accountId,
    entityId: entity.entityId,
  });

  return versions?.map((ver) => ({
    entityVersionId: ver.entityVersionId,
    createdAt: ver.createdAt,
  }));
};
