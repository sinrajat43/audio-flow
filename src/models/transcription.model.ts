import mongoose, { Schema, Model } from 'mongoose';
import { ITranscription } from '../types';

// Interface for static methods
interface ITranscriptionModel extends Model<ITranscription> {
  findRecentTranscriptions(
    days: number,
    page: number,
    limit: number,
    source?: string,
  ): Promise<{
    transcriptions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

/**
 * Transcription Schema
 * Stores audio transcription records with proper indexing for efficient queries
 */
const transcriptionSchema = new Schema<ITranscription>(
  {
    audioUrl: {
      type: String,
      required: [true, 'Audio URL is required'],
      trim: true,
      index: true, // Index for duplicate checks and lookups
    },
    transcription: {
      type: String,
      required: [true, 'Transcription text is required'],
    },
    source: {
      type: String,
      enum: ['mock', 'azure'],
      default: 'mock',
      required: true,
    },
    language: {
      type: String,
      enum: ['en-US', 'fr-FR', 'es-ES', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'transcriptions',
  },
);

// Compound index for efficient date-range queries with filtering by source
// This is crucial for the GET /transcriptions endpoint with 100M+ records
transcriptionSchema.index({ createdAt: -1, source: 1 });

// Additional indexes for common query patterns
transcriptionSchema.index({ createdAt: -1 }); // For date-based sorting
transcriptionSchema.index({ source: 1, createdAt: -1 }); // For filtering by source

// Index for WebSocket sessions
transcriptionSchema.index({ 'metadata.sessionId': 1 }, { sparse: true });

// Virtual for id field (MongoDB _id to id)
transcriptionSchema.virtual('id').get(function (this: ITranscription & { _id: unknown }) {
  return (this._id as { toString(): string }).toString();
});

// Ensure virtuals are included when converting to JSON
transcriptionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc: any, ret: any) {
    delete ret._id;
    return ret;
  },
});

/**
 * Static method to find transcriptions created in the last N days
 */
transcriptionSchema.statics.findRecentTranscriptions = async function (
  days: number,
  page = 1,
  limit = 10,
  source?: string,
) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);

  const query: Record<string, unknown> = {
    createdAt: { $gte: threshold },
  };

  if (source) {
    query.source = source;
  }

  const skip = (page - 1) * limit;

  const [transcriptions, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(query),
  ]);

  return {
    transcriptions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Instance method to format response
 */
transcriptionSchema.methods.toResponse = function (this: ITranscription & { id: string }) {
  return {
    id: this.id,
    audioUrl: this.audioUrl,
    transcription: this.transcription,
    source: this.source,
    language: this.language,
    createdAt: this.createdAt,
  };
};

// Create and export the model
export const TranscriptionModel = mongoose.model<ITranscription, ITranscriptionModel>(
  'Transcription',
  transcriptionSchema,
);
