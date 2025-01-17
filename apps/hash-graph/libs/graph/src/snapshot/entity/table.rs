use graph_types::{
    knowledge::{
        entity::{
            DraftId, EntityEditionId, EntityEditionProvenanceMetadata, EntityUuid,
            InferredEntityProvenanceMetadata,
        },
        Confidence, PropertyObject, PropertyPath,
    },
    owned_by_id::OwnedById,
    Embedding,
};
use postgres_types::ToSql;
use temporal_versioning::{DecisionTime, LeftClosedTemporalInterval, Timestamp, TransactionTime};
use uuid::Uuid;

#[derive(Debug, ToSql)]
#[postgres(name = "entity_ids")]
pub struct EntityIdRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub provenance: InferredEntityProvenanceMetadata,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_drafts")]
pub struct EntityDraftRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub draft_id: DraftId,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_editions")]
pub struct EntityEditionRow {
    pub entity_edition_id: EntityEditionId,
    pub properties: PropertyObject,
    pub archived: bool,
    pub confidence: Option<Confidence>,
    pub provenance: EntityEditionProvenanceMetadata,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_editions")]
pub struct EntityPropertyRow {
    pub entity_edition_id: EntityEditionId,
    pub property_path: PropertyPath<'static>,
    pub confidence: Option<Confidence>,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_is_of_type")]
pub struct EntityIsOfTypeRow {
    pub entity_edition_id: EntityEditionId,
    pub entity_type_ontology_id: Uuid,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_temporal_metadata")]
pub struct EntityTemporalMetadataRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub draft_id: Option<DraftId>,
    pub entity_edition_id: EntityEditionId,
    pub decision_time: LeftClosedTemporalInterval<DecisionTime>,
    pub transaction_time: LeftClosedTemporalInterval<TransactionTime>,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_has_left_entity")]
pub struct EntityHasLeftEntityRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub left_web_id: OwnedById,
    pub left_entity_uuid: EntityUuid,
    pub confidence: Option<Confidence>,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_has_right_entity")]
pub struct EntityHasRightEntityRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub right_web_id: OwnedById,
    pub right_entity_uuid: EntityUuid,
    pub confidence: Option<Confidence>,
}

#[derive(Debug, ToSql)]
#[postgres(name = "entity_embeddings")]
pub struct EntityEmbeddingRow {
    pub web_id: OwnedById,
    pub entity_uuid: EntityUuid,
    pub draft_id: Option<DraftId>,
    pub property: Option<String>,
    pub embedding: Embedding<'static>,
    pub updated_at_transaction_time: Timestamp<TransactionTime>,
    pub updated_at_decision_time: Timestamp<DecisionTime>,
}
