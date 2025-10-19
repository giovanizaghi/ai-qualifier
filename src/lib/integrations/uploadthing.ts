import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/lib/auth"

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  profileImage: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await auth()

      // If you throw, the user will not be able to upload
      if (!session?.user?.id) throw new Error("Unauthorized")

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.url)

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  assessmentFiles: f({ 
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "16MB" },
    "text/plain": { maxFileSize: "2MB" }
  })
    .middleware(async ({ req }) => {
      const session = await auth()
      if (!session?.user?.id) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Assessment file upload complete for userId:", metadata.userId)
      console.log("file url", file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  adminFiles: f({
    image: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "32MB" },
    "application/json": { maxFileSize: "1MB" },
    "text/csv": { maxFileSize: "4MB" }
  })
    .middleware(async ({ req }) => {
      const session = await auth()
      if (!session?.user?.id) throw new Error("Unauthorized")
      
      // Check if user has admin role
      if (session.user.role !== "ADMIN") {
        throw new Error("Admin access required")
      }
      
      return { userId: session.user.id, role: session.user.role }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Admin file upload complete for userId:", metadata.userId)
      console.log("file url", file.url)
      return { uploadedBy: metadata.userId, url: file.url, role: metadata.role }
    }),

  bulkUpload: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await auth()
      if (!session?.user?.id) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Bulk upload complete for userId:", metadata.userId)
      console.log("file url", file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter