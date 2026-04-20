module {{GO_MODULE}}

go 1.25.0

require (
	github.com/pocketbase/pocketbase v0.36.8
	tinycld.org/audit v0.0.0
)

replace tinycld.org/audit => ../../../server/audit
