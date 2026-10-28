CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "assistant_api_rate_limit_counters" (
	"bucket_key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_ingestion_runs" (
	"run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"okf_bundle_sha256" text NOT NULL,
	"embedding_model" text NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"deleted_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_retrieval_units" (
	"unit_id" text PRIMARY KEY NOT NULL,
	"okf_concept_id" text NOT NULL,
	"okf_version" text NOT NULL,
	"source_class" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"resource" text NOT NULL,
	"retrieval_text" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assistant_api_rate_limit_counters_window_ends_at_idx" ON "assistant_api_rate_limit_counters" USING btree ("window_ends_at");--> statement-breakpoint
CREATE INDEX "assistant_ingestion_runs_finished_at_idx" ON "assistant_ingestion_runs" USING btree ("finished_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "assistant_retrieval_units_source_class_idx" ON "assistant_retrieval_units" USING btree ("source_class");--> statement-breakpoint
CREATE INDEX "assistant_retrieval_units_okf_concept_id_idx" ON "assistant_retrieval_units" USING btree ("okf_concept_id");