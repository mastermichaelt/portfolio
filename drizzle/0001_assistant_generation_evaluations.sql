CREATE TABLE "assistant_generation_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"question" text NOT NULL,
	"question_length" integer NOT NULL,
	"answer_text" text,
	"support_level" text,
	"abstained" boolean DEFAULT false NOT NULL,
	"abstention_reason" text,
	"failure_category" text,
	"evidence_unit_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"retrieved_evidence_count" integer,
	"attribution_counts" jsonb,
	"model" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"retrieval_latency_ms" integer,
	"assembly_latency_ms" integer,
	"generation_latency_ms" integer,
	"total_latency_ms" integer
);
--> statement-breakpoint
CREATE INDEX "assistant_generation_evaluations_created_at_idx" ON "assistant_generation_evaluations" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "assistant_generation_evaluations_status_idx" ON "assistant_generation_evaluations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assistant_generation_evaluations_support_level_idx" ON "assistant_generation_evaluations" USING btree ("support_level");