# The worker uses the same Prisma schema as the main app.
#
# In production, either:
#   1. Keep a copy of schema.prisma in sync with flareo/prisma/schema.prisma
#   2. Or symlink this directory's prisma/ to flareo/prisma/
#
# Option 2 is cleaner; option 1 is easier if the worker is deployed
# to a different host than the main app.

# The deploy script (see README) copies schema.prisma from the main
# repo into this directory before `prisma generate` runs. That keeps
# the schema as a single source of truth without a hard filesystem
# dependency.
