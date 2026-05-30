.PHONY: run build clean test

air:
	go run main.go

build:
	go build -o bin/server ./main.go

clean:
	rm -rf bin/

test:
	go test ./...
