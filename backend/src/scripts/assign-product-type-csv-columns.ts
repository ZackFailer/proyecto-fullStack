import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { ProductType, IProductAttribute } from '../models/product-type.model.js'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/admin_db'

const assignCsvColumns = (attributes: IProductAttribute[]): { attributes: IProductAttribute[]; changed: boolean } => {
  const taken = new Set<number>()
  let next = 1
  let changed = false

  const updated = attributes.map((attr) => {
    if (attr.csvColumn !== undefined && attr.csvColumn !== null) {
      taken.add(attr.csvColumn)
      return attr
    }

    while (taken.has(next) && next <= 10) {
      next++
    }

    if (next > 10) {
      throw new Error(`Tipo con más de 10 atributos mapeables: ${attr.key}`)
    }

    const withColumn = { ...attr, csvColumn: next }
    taken.add(next)
    next++
    changed = true
    return withColumn
  })

  return { attributes: updated, changed }
}

const run = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI)

  try {
    const types = await ProductType.find({ isActive: true })
    let updatedTypes = 0

    for (const type of types) {
      const { attributes, changed } = assignCsvColumns(type.attributes as unknown as IProductAttribute[])
      if (!changed) {
        continue
      }

      type.attributes = attributes
      await type.save()
      updatedTypes++
      console.log(`Updated ${type.id} (${type.name})`)
    }

    console.log(`Done. Updated product types: ${updatedTypes}`)
  } finally {
    await mongoose.disconnect()
  }
}

run().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
