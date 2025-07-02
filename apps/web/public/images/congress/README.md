# Congressional Photos Directory

This directory contains locally stored congressional member photos organized by Congress number.

## Structure
```
public/images/congress/
├── 117/          # 117th Congress (2021-2023)
├── 118/          # 118th Congress (2023-2025)  
├── 119/          # 119th Congress (2025-2027)
└── {bioguide_id}/
    ├── original.jpg   # Original downloaded photo
    ├── large.jpg      # 600x600 optimized for profile pages
    ├── medium.jpg     # 300x300 optimized for cards
    └── thumbnail.jpg  # 150x150 optimized for lists
```

## Example Structure
```
public/images/congress/119/C001078/
├── original.jpg
├── large.jpg
├── medium.jpg
└── thumbnail.jpg

public/images/congress/119/F000477/
├── original.jpg
├── large.jpg
├── medium.jpg
└── thumbnail.jpg
```

## Photo Sources
Photos are downloaded from the [unitedstates/images](https://github.com/unitedstates/images) repository.

## Management
- Use the admin congressional photos panel to download and process photos
- Photos are automatically optimized into multiple sizes for performance
- Each photo is stored with congress number for historical tracking
- Use the AI command center with commands like "download congressional photos for 119th congress"

## Database Integration
Photos are tracked in the `congressional_photos` table with:
- `bioguide_id` and `congress_number` as unique identifiers
- Local file paths stored as relative paths from public directory
- Metadata including dimensions, file sizes, and optimization status

Generated on: 2025-01-27T04:00:00.000Z
