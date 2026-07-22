# Hướng dẫn sử dụng variants

Các UI primitive trong `client/src/components/ui/` dùng API `variant` một
chiều. Không kết hợp `variant` với `tone`, `selected` hoặc `featured`.

## Button

### Solid

```jsx
<Button variant="default">Lưu</Button>
<Button variant="secondary">Hành động phụ</Button>
<Button variant="success">Phê duyệt</Button>
<Button variant="warning">Cần chú ý</Button>
<Button variant="destructive">Xóa</Button>
<Button variant="info">Xem thông tin</Button>
```

### Soft

```jsx
<Button variant="soft-primary">Đang chọn</Button>
<Button variant="soft-success">Hoàn thành</Button>
<Button variant="soft-warning">Cảnh báo</Button>
<Button variant="soft-destructive">Từ chối</Button>
<Button variant="soft-info">Chi tiết</Button>
```

### Outline, ghost và link

```jsx
<Button variant="outline">Chưa chọn</Button>
<Button variant="ghost">Thao tác toolbar</Button>
<Button variant="link">Xem thêm</Button>
```

Không dùng `active` hoặc `inactive`:

```jsx
<Button
  variant={isSelected ? "soft-primary" : "outline"}
  aria-pressed={isSelected}
>
  Lớp bản đồ
</Button>
```

Không dùng `ghost` để biểu diễn trạng thái chưa chọn vì độ tương phản thấp.

### Gradient

```jsx
<Button variant="gradient-primary">Gửi phản ánh</Button>
<Button variant="gradient-info">Phân tích dữ liệu</Button>
```

Các variant hiện có:

- `gradient-primary`
- `gradient-secondary`
- `gradient-accent`
- `gradient-success`
- `gradient-warning`
- `gradient-destructive`
- `gradient-info`
- `gradient-map`
- `gradient-fire`

Chỉ dùng gradient cho CTA nổi bật, không dùng cho thao tác thường xuyên.

### Loading

```jsx
<Button variant="default" isLoading={mutation.isPending}>
  Lưu thay đổi
</Button>
```

`isLoading` tự thêm spinner, `aria-busy` và trạng thái disabled.

## Badge

Badge hỗ trợ:

```txt
default | secondary | destructive | success | warning | info
outline | ghost
soft-primary | soft-success | soft-warning | soft-destructive | soft-info
```

```jsx
<Badge variant="soft-warning">Chờ xử lý</Badge>
<Badge variant="destructive">Nguy hiểm</Badge>
```

## Input, Textarea và SelectTrigger

Các field hỗ trợ:

```txt
default | filled | primary | success | warning | destructive | info
soft-primary | soft-success | soft-warning | soft-destructive | soft-info
```

```jsx
<Input variant={hasError ? "destructive" : "default"} />
<Textarea variant="soft-info" isLoading={isLoading} />
<SelectTrigger variant="filled" />
```

## Checkbox

```txt
default | secondary | success | warning | destructive | info
```

```jsx
<Checkbox variant="default" checked={enabled} />
```

Trạng thái chọn dùng prop native `checked`, không dùng variant
`active/inactive`.

## Slider

```txt
default | secondary | success | warning | destructive | info
gradient-primary | gradient-secondary | gradient-success
gradient-warning | gradient-destructive | gradient-info
gradient-map | gradient-fire
```

```jsx
<Slider variant="info" value={[opacity]} />
```

## DropdownMenuItem

```txt
default | primary | success | warning | destructive | info
soft-primary | soft-success | soft-warning | soft-destructive | soft-info
```

```jsx
<DropdownMenuItem variant="destructive">
  Xóa lớp dữ liệu
</DropdownMenuItem>
```

## Accessibility

- Button chỉ có icon phải có `aria-label` và nên có Tooltip.
- Toggle Button dùng `aria-pressed`.
- Field lỗi dùng `variant="destructive"` và `aria-invalid`.
- Không hardcode màu để ghi đè variant.
- Không dùng các variant `active`, `inactive`, `gradient-active` hoặc
  `gradient-inactive`.
